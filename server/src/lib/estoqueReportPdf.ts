import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import type { Category, Estoque, Item } from "@prisma/client";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const ROW_HEIGHT = 18;

const COL_WIDTHS = [
  { key: "categoria", label: "Categoria", width: 75 },
  { key: "material", label: "Material", width: 195 },
  { key: "disponivel", label: "Disponível", width: 65 },
  { key: "cautelado", label: "Cautelado", width: 65 },
  { key: "fa", label: "F.A", width: 45 },
  { key: "total", label: "Total", width: 70.28 },
] as const;

let runningX = MARGIN;
const COLS = COL_WIDTHS.map((col) => {
  const withX = { ...col, x: runningX };
  runningX += col.width;
  return withX;
});

function formatDateBR(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

type ItemWithCategory = Item & { category: Category };

export async function generateEstoqueReportPdf(estoque: Estoque, items: ItemWithCategory[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const rowShade = rgb(0.95, 0.95, 0.95);
  const brandRed = rgb(0.55, 0.05, 0.08);

  const sorted = [...items].sort(
    (a, b) => a.category.name.localeCompare(b.category.name, "pt-BR") || a.name.localeCompare(b.name, "pt-BR"),
  );

  let page!: PDFPage;
  let y!: number;

  function drawPageHeader(isFirst: boolean) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;

    if (isFirst) {
      page.drawText("CBMRS — Sistema Online para B4", { x: MARGIN, y, size: 10, font: bold, color: brandRed });
      y -= 18;
      page.drawText(`Relatório de Materiais — ${estoque.name}`, { x: MARGIN, y, size: 15, font: bold, color: black });
      y -= 16;
      page.drawText(`Gerado em ${formatDateBR(new Date())}`, { x: MARGIN, y, size: 9, font, color: gray });
      y -= 22;
    } else {
      page.drawText(`Relatório de Materiais — ${estoque.name} (continuação)`, {
        x: MARGIN,
        y,
        size: 11,
        font: bold,
        color: black,
      });
      y -= 22;
    }

    drawTableHeader();
  }

  function drawTableHeader() {
    page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height: ROW_HEIGHT, color: brandRed });
    for (const col of COLS) {
      page.drawText(col.label, { x: col.x + 4, y: y, size: 9, font: bold, color: rgb(1, 1, 1) });
    }
    y -= ROW_HEIGHT;
  }

  function ensureSpace() {
    if (y - ROW_HEIGHT < MARGIN) {
      drawPageHeader(false);
    }
  }

  drawPageHeader(true);

  let rowIndex = 0;
  const totals = { disponivel: 0, cautelado: 0, fa: 0, total: 0 };

  for (const item of sorted) {
    ensureSpace();

    if (rowIndex % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height: ROW_HEIGHT, color: rowShade });
    }

    const values: Record<(typeof COLS)[number]["key"], string> = {
      categoria: item.category.name,
      material: item.name,
      disponivel: String(item.quantityAvailable),
      cautelado: String(item.quantityCheckedOut),
      fa: String(item.quantityUnavailable),
      total: String(item.quantityTotal),
    };

    for (const col of COLS) {
      const text = truncateToWidth(values[col.key], font, 9, col.width - 8);
      page.drawText(text, { x: col.x + 4, y, size: 9, font, color: black });
    }

    totals.disponivel += item.quantityAvailable;
    totals.cautelado += item.quantityCheckedOut;
    totals.fa += item.quantityUnavailable;
    totals.total += item.quantityTotal;

    y -= ROW_HEIGHT;
    rowIndex += 1;
  }

  ensureSpace();
  page.drawLine({
    start: { x: MARGIN, y: y + ROW_HEIGHT - 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + ROW_HEIGHT - 4 },
    thickness: 0.75,
    color: black,
  });
  const totalValues: Record<(typeof COLS)[number]["key"], string> = {
    categoria: "",
    material: `Total (${sorted.length} materiais)`,
    disponivel: String(totals.disponivel),
    cautelado: String(totals.cautelado),
    fa: String(totals.fa),
    total: String(totals.total),
  };
  for (const col of COLS) {
    page.drawText(totalValues[col.key], { x: col.x + 4, y, size: 9, font: bold, color: black });
  }

  return pdfDoc.save();
}

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}
