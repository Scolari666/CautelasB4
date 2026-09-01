-- AlterTable
ALTER TABLE "Cautela" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Cautela_groupId_idx" ON "Cautela"("groupId");
