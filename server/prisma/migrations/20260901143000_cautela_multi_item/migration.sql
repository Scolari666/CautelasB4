-- Uma cautela combinada passa a ser UM registro (Cautela) com vários itens
-- (CautelaItem), em vez de um registro de Cautela por item compartilhando
-- um groupId. Esta migration preserva os dados existentes.

-- CreateTable
CREATE TABLE "CautelaItem" (
    "id" TEXT NOT NULL,
    "cautelaId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "CautelaStatus" NOT NULL DEFAULT 'ATIVA',
    "returnedAt" TIMESTAMP(3),
    "returnNotes" TEXT,

    CONSTRAINT "CautelaItem_pkey" PRIMARY KEY ("id")
);

-- Backfill: cada Cautela existente vira um CautelaItem (mesmo id, ainda
-- apontando 1:1 para a Cautela de origem nesta etapa)
INSERT INTO "CautelaItem" ("id", "cautelaId", "itemId", "quantity", "status", "returnedAt", "returnNotes")
SELECT "id", "id", "itemId", "quantity", "status", "returnedAt", "returnNotes"
FROM "Cautela";

-- Funde cautelas que compartilhavam o mesmo groupId (cautelas combinadas
-- antigas) em uma única Cautela "primária" por grupo
WITH primaries AS (
  SELECT DISTINCT ON ("groupId") "id" AS primary_id, "groupId"
  FROM "Cautela"
  WHERE "groupId" IS NOT NULL
  ORDER BY "groupId", "takenAt" ASC, "id" ASC
)
UPDATE "CautelaItem" ci
SET "cautelaId" = p.primary_id
FROM "Cautela" c
JOIN primaries p ON p."groupId" = c."groupId"
WHERE ci."cautelaId" = c."id";

WITH primaries AS (
  SELECT DISTINCT ON ("groupId") "id" AS primary_id, "groupId"
  FROM "Cautela"
  WHERE "groupId" IS NOT NULL
  ORDER BY "groupId", "takenAt" ASC, "id" ASC
)
DELETE FROM "Cautela" c
USING primaries p
WHERE c."groupId" = p."groupId" AND c."id" <> p.primary_id;

-- Remove as colunas que agora vivem em CautelaItem
ALTER TABLE "Cautela" DROP CONSTRAINT "Cautela_itemId_fkey";
DROP INDEX "Cautela_groupId_idx";
ALTER TABLE "Cautela" DROP COLUMN "itemId";
ALTER TABLE "Cautela" DROP COLUMN "quantity";
ALTER TABLE "Cautela" DROP COLUMN "status";
ALTER TABLE "Cautela" DROP COLUMN "returnedAt";
ALTER TABLE "Cautela" DROP COLUMN "returnNotes";
ALTER TABLE "Cautela" DROP COLUMN "groupId";

-- CreateIndex
CREATE INDEX "CautelaItem_cautelaId_idx" ON "CautelaItem"("cautelaId");
CREATE INDEX "CautelaItem_itemId_idx" ON "CautelaItem"("itemId");

-- AddForeignKey
ALTER TABLE "CautelaItem" ADD CONSTRAINT "CautelaItem_cautelaId_fkey" FOREIGN KEY ("cautelaId") REFERENCES "Cautela"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CautelaItem" ADD CONSTRAINT "CautelaItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
