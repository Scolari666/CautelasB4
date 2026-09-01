-- AlterTable
ALTER TABLE "Cautela" ADD COLUMN     "retiradoPorNome" TEXT,
ADD COLUMN     "retiradoPorTelefone" TEXT;

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_name_key" ON "Estoque"("name");

-- Seed default estoques
INSERT INTO "Estoque" ("id", "name") VALUES ('estoque-sma-poa', 'SMA POA');
INSERT INTO "Estoque" ("id", "name") VALUES ('estoque-sma-cachoeirinha', 'SMA Cachoeirinha');

-- AlterTable: add column nullable first so existing rows can be backfilled
ALTER TABLE "Item" ADD COLUMN     "estoqueId" TEXT;

-- Backfill existing items into SMA POA
UPDATE "Item" SET "estoqueId" = 'estoque-sma-poa' WHERE "estoqueId" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "Item" ALTER COLUMN "estoqueId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
