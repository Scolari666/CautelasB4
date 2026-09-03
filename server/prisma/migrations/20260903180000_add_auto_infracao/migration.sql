-- CreateTable
CREATE TABLE "AutoInfracao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dataLavratura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horario" TEXT,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "ppciPspci" TEXT,
    "numeroLogradouro" TEXT,
    "logradouro" TEXT,
    "bairro" TEXT,
    "municipio" TEXT,
    "complemento" TEXT,
    "infratorRazaoSocial" TEXT,
    "infratorCnpj" TEXT,
    "infratorNome" TEXT,
    "infratorCpf" TEXT,
    "infratorTelefone" TEXT,
    "infratorEmail" TEXT,
    "infracoes" TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoInfracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoInfracao_createdById_idx" ON "AutoInfracao"("createdById");

-- AddForeignKey
ALTER TABLE "AutoInfracao" ADD CONSTRAINT "AutoInfracao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
