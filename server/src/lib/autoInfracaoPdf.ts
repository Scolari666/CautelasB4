import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { AutoInfracao, User } from "@prisma/client";

type AutoInfracaoWithRelations = AutoInfracao & { createdBy: Pick<User, "name"> };

const TEMPLATE_PATH = path.join(__dirname, "../../templates/anexo-a.pdf");
const PAGE_HEIGHT = 841.89;

function toPdfY(topFromPageTop: number) {
  return PAGE_HEIGHT - topFromPageTop;
}

function formatDateBR(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

// Posição (x, topo-do-texto-a-partir-do-topo-da-página) de cada campo do formulário,
// medida diretamente sobre o PDF escaneado do Anexo A (596 x 842pt, A4).
const FIELDS = {
  numero: { x: 465, y: 64, size: 11 },
  dataLavratura: { x: 430, y: 80, size: 9 },
  horario: { x: 545, y: 80, size: 9 },

  razaoSocial: { x: 225, y: 121, size: 9, maxWidth: 305 },
  nomeFantasia: { x: 232, y: 135, size: 9, maxWidth: 298 },
  ppciPspci: { x: 250, y: 149, size: 9, maxWidth: 220 },
  numeroLogradouro: { x: 505, y: 149, size: 9, maxWidth: 30 },
  logradouro: { x: 170, y: 156, size: 8, maxWidth: 45 },
  bairro: { x: 265, y: 156, size: 8, maxWidth: 185 },
  municipio: { x: 455, y: 156, size: 8, maxWidth: 80 },
  complemento: { x: 175, y: 166, size: 9, maxWidth: 355 },

  infratorRazaoSocial: { x: 135, y: 188, size: 9, maxWidth: 255 },
  infratorCnpj: { x: 400, y: 178, size: 9, maxWidth: 135 },
  infratorNome: { x: 100, y: 198, size: 9, maxWidth: 230 },
  infratorCpf: { x: 340, y: 198, size: 9, maxWidth: 195 },
  infratorTelefone: { x: 135, y: 208, size: 9, maxWidth: 190 },
  infratorEmail: { x: 345, y: 208, size: 9, maxWidth: 190 },

  agenteFiscalizador: { x: 270, y: 796, size: 8, maxWidth: 135 },
} as const;

// Posição do topo de cada quadradinho "□" de infração (~8pt de lado).
const CHECKBOXES: Record<string, { x: number; y: number }> = {
  LEVE_A: { x: 75, y: 236 },
  LEVE_B: { x: 305, y: 236 },

  MEDIA_A: { x: 75, y: 283 },
  MEDIA_B: { x: 75, y: 341 },
  MEDIA_C: { x: 75, y: 379 },
  MEDIA_D: { x: 75, y: 421 },
  MEDIA_E: { x: 75, y: 461 },
  MEDIA_F: { x: 305, y: 264 },
  MEDIA_G: { x: 305, y: 333 },
  MEDIA_H: { x: 305, y: 380 },
  MEDIA_I: { x: 305, y: 416 },
  MEDIA_J: { x: 305, y: 461 },

  GRAVE_A: { x: 75, y: 513 },
  GRAVE_B: { x: 75, y: 561 },
  GRAVE_C: { x: 75, y: 596 },
  GRAVE_D: { x: 75, y: 624 },
  GRAVE_E: { x: 75, y: 663 },
  GRAVE_F: { x: 75, y: 698 },
  GRAVE_G: { x: 75, y: 733 },
  GRAVE_H: { x: 75, y: 755 },
  GRAVE_I: { x: 305, y: 503 },
  GRAVE_J: { x: 305, y: 530 },
  GRAVE_K: { x: 305, y: 561 },
  GRAVE_L: { x: 305, y: 589 },
  GRAVE_M: { x: 305, y: 608 },
  GRAVE_N: { x: 305, y: 630 },
  GRAVE_O: { x: 305, y: 663 },
  GRAVE_P: { x: 305, y: 698 },
  GRAVE_Q: { x: 305, y: 733 },
};

export async function generateAutoInfracaoPdf(auto: AutoInfracaoWithRelations): Promise<Uint8Array> {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  // O PDF-modelo é o scan de um auto de infração real, que já vem com o
  // número "2460" impresso no cabeçalho — apagamos essa região antes de
  // escrever o número informado pelo usuário.
  page.drawRectangle({ x: 456, y: toPdfY(78), width: 90, height: 78 - 44, color: white });

  function fittedSize(text: string, baseSize: number, maxWidth: number | undefined, f: PDFFont) {
    if (!maxWidth) return baseSize;
    let size = baseSize;
    while (size > 5.5 && f.widthOfTextAtSize(text, size) > maxWidth) {
      size -= 0.5;
    }
    return size;
  }

  function writeField(key: keyof typeof FIELDS, value: string | null | undefined) {
    if (!value) return;
    const text = value.trim();
    if (!text) return;
    const field = FIELDS[key];
    const maxWidth = "maxWidth" in field ? field.maxWidth : undefined;
    const size = fittedSize(text, field.size, maxWidth, font);
    page.drawText(text, { x: field.x, y: toPdfY(field.y), size, font, color: black });
  }

  writeField("numero", auto.numero);
  writeField("dataLavratura", formatDateBR(auto.dataLavratura));
  writeField("horario", auto.horario);

  writeField("razaoSocial", auto.razaoSocial);
  writeField("nomeFantasia", auto.nomeFantasia);
  writeField("ppciPspci", auto.ppciPspci);
  writeField("numeroLogradouro", auto.numeroLogradouro);
  writeField("logradouro", auto.logradouro);
  writeField("bairro", auto.bairro);
  writeField("municipio", auto.municipio);
  writeField("complemento", auto.complemento);

  writeField("infratorRazaoSocial", auto.infratorRazaoSocial);
  writeField("infratorCnpj", auto.infratorCnpj);
  writeField("infratorNome", auto.infratorNome);
  writeField("infratorCpf", auto.infratorCpf);
  writeField("infratorTelefone", auto.infratorTelefone);
  writeField("infratorEmail", auto.infratorEmail);

  writeField("agenteFiscalizador", auto.createdBy.name);

  for (const code of auto.infracoes) {
    const box = CHECKBOXES[code];
    if (!box) continue;
    page.drawText("X", { x: box.x + 1, y: toPdfY(box.y + 7.5), size: 8, font: boldFont, color: black });
  }

  return pdfDoc.save();
}
