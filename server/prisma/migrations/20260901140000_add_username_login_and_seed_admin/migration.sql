-- Login passa a ser feito por nome de usuário em vez de e-mail.

-- AlterTable: adiciona username (nullable por enquanto) e torna email opcional
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Backfill: deriva um username a partir do e-mail existente (só relevante para
-- ambientes que já tinham usuários cadastrados antes desta migration)
UPDATE "User"
SET "username" = lower(split_part(COALESCE("email", 'usuario-' || substr("id", 1, 8)), '@', 1)) || '-' || substr("id", 1, 4)
WHERE "username" IS NULL;

-- Agora que todo mundo tem um valor, torna a coluna obrigatória e única
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Semeia o usuário administrador inicial (senha: scolarib4 — troque após o primeiro acesso)
INSERT INTO "User" ("id", "name", "username", "email", "passwordHash", "role", "createdAt")
VALUES (
  'user-admin-scolari',
  'Scolari',
  'scolari',
  NULL,
  '$2a$10$D0PE/.qQjogvG..nL8faVeCC/WwzK5oxVbMVoh4LXSjjLjAIX/KKG',
  'ADMIN',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("username") DO NOTHING;
