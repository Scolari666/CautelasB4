-- Adiciona foto de perfil (armazenada como data URL base64) ao usuário
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
