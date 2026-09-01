import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Cautela, Item, User } from "@prisma/client";

const TEMPLATE_PATH = path.join(__dirname, "../../templates/cautela-material.pdf");
const PAGE_HEIGHT = 841.89;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatDateParts(date: Date) {
  return {
    dia: String(date.getDate()).padStart(2, "0"),
    mes: MESES[date.getMonth()],
    ano: String(date.getFullYear()),
  };
}

function formatDateBR(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function toPdfY(topFromPageTop: number) {
  return PAGE_HEIGHT - topFromPageTop;
}

type CautelaWithRelations = Cautela & { item: Item; user: User };

/**
 * Gera o PDF de uma cautela. Quando `cautelas` tem mais de um elemento (cautela
 * combinada, todos com o mesmo groupId), cada item ocupa uma linha da tabela e os
 * dados de responsável/data usam o primeiro registro, comum a todo o grupo.
 */
export async function generateCautelaPdf(cautelas: CautelaWithRelations[]): Promise<Uint8Array> {
  const primary = cautelas[0];
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);

  function eraseRegion(x: number, topStart: number, width: number, topEnd: number) {
    page.drawRectangle({
      x,
      y: toPdfY(topEnd),
      width,
      height: topEnd - topStart,
      color: white,
    });
  }

  function writeText(text: string, x: number, baselineTop: number, size = 9) {
    if (!text) return;
    page.drawText(text, { x, y: toPdfY(baselineTop), size, font, color: black });
  }

  // Cabeçalho: "Porto Alegre, RS, {dia} de {mês} de {ano}" (margem para preservar as bordas da célula)
  eraseRegion(286, 133.5, 511.9 - 286, 143.0);
  const { dia, mes, ano } = formatDateParts(primary.takenAt);
  writeText(`Porto Alegre, RS, ${dia} de ${mes} de ${ano}`, 290, 142.5, 9.5);

  // Remove resíduos pré-existentes no template (marcações soltas nas linhas 5 e 6 da tabela),
  // com margem para não apagar as linhas de grade da tabela
  eraseRegion(179, 351.9, 30, 364.2);
  eraseRegion(100, 366.2, 60, 378.6);

  // Tabela de materiais — uma linha por item da cautela (até 12, limite do formulário)
  const rowBottoms = [307.9, 322.2, 336.6, 350.9, 365.2, 379.6, 393.9, 408.2, 422.5, 436.9, 451.2, 465.6];
  cautelas.slice(0, rowBottoms.length).forEach((c, i) => {
    const rowBottom = rowBottoms[i];
    writeText(String(c.quantity), 118, rowBottom - 4, 9);
    writeText(c.item.name, 183, rowBottom - 4, 9);
  });

  // RETIRADO POR
  writeText(primary.user.name, 225, 510.0 - 1, 9);
  const dataRetirada = formatDateBR(primary.takenAt);
  writeText(dataRetirada, 225, 533.0 - 1, 9);
  const allReturned = cautelas.every((c) => c.status === "DEVOLVIDA");
  const dataEntrega = allReturned
    ? cautelas.reduce<Date | null>(
        (latest, c) => (c.returnedAt && (!latest || c.returnedAt > latest) ? c.returnedAt : latest),
        null,
      )
    : primary.expectedReturnAt;
  if (dataEntrega) {
    writeText(formatDateBR(dataEntrega), 225, 544.5 - 1, 9);
  }

  // MILITAR ESTADUAL QUE REALIZOU A ENTREGA DO MATERIAL — dados de quem criou a cautela
  writeText(primary.user.name, 197, 668.4 - 1, 9);
  writeText(primary.user.graduacao ?? "", 197, 679.9 - 1, 9);
  writeText(primary.user.matricula ?? "", 197, 691.4 - 1, 9);

  return pdfDoc.save();
}
