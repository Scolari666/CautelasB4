import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { emitStockUpdate } from "../socket";
import { generateCautelaPdf } from "../lib/cautelaPdf";

const MAX_ITENS_POR_CAUTELA = 12;

export const cautelasRouter = Router();

const CAUTELA_INCLUDE = {
  user: { select: { id: true, name: true, matricula: true } },
  items: { include: { item: { include: { category: true } } } },
} as const;

cautelasRouter.get("/", requireAuth, async (req, res) => {
  const { status, userId, itemId } = req.query;
  const cautelas = await prisma.cautela.findMany({
    where: {
      userId: userId ? String(userId) : undefined,
      items: itemId ? { some: { itemId: String(itemId) } } : undefined,
      ...(status === "ATIVA" ? { items: { some: { status: "ATIVA" } } } : {}),
      ...(status === "DEVOLVIDA" ? { items: { none: { status: "ATIVA" } } } : {}),
    },
    include: CAUTELA_INCLUDE,
    orderBy: { takenAt: "desc" },
  });
  res.json(cautelas);
});

cautelasRouter.get("/minhas", requireAuth, async (req: AuthedRequest, res) => {
  const cautelas = await prisma.cautela.findMany({
    where: { userId: req.user!.userId },
    include: CAUTELA_INCLUDE,
    orderBy: { takenAt: "desc" },
  });
  res.json(cautelas);
});

cautelasRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { items, purpose, expectedReturnAt, retiradoPorNome, retiradoPorTelefone } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Informe ao menos um item" });
  }
  if (items.length > MAX_ITENS_POR_CAUTELA) {
    return res.status(400).json({ error: `Uma cautela suporta no máximo ${MAX_ITENS_POR_CAUTELA} itens` });
  }

  const parsed = items.map((i: Record<string, unknown>) => ({
    itemId: String(i?.itemId ?? ""),
    quantity: Number(i?.quantity),
  }));
  for (const p of parsed) {
    if (!p.itemId || !Number.isFinite(p.quantity) || p.quantity <= 0) {
      return res.status(400).json({ error: "Item e quantidade válida são obrigatórios em cada linha" });
    }
  }
  const itemIds = parsed.map((p) => p.itemId);
  if (new Set(itemIds).size !== itemIds.length) {
    return res.status(400).json({ error: "Cada item só pode aparecer uma vez na mesma cautela" });
  }

  const dbItems = await prisma.item.findMany({ where: { id: { in: itemIds } } });
  if (dbItems.length !== itemIds.length) {
    return res.status(404).json({ error: "Um ou mais itens não foram encontrados" });
  }
  for (const p of parsed) {
    const item = dbItems.find((i) => i.id === p.itemId)!;
    if (item.quantityAvailable < p.quantity) {
      return res.status(409).json({ error: `Apenas ${item.quantityAvailable} unidade(s) disponível(is) para "${item.name}"` });
    }
  }

  const cautela = await prisma.$transaction(async (tx) => {
    const created = await tx.cautela.create({
      data: {
        userId: req.user!.userId,
        purpose: purpose?.trim() || null,
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
        retiradoPorNome: retiradoPorNome?.trim() || null,
        retiradoPorTelefone: retiradoPorTelefone?.trim() || null,
        items: { create: parsed.map((p) => ({ itemId: p.itemId, quantity: p.quantity })) },
      },
      include: CAUTELA_INCLUDE,
    });
    for (const p of parsed) {
      await tx.item.update({
        where: { id: p.itemId },
        data: { quantityAvailable: { decrement: p.quantity }, quantityCheckedOut: { increment: p.quantity } },
      });
    }
    return created;
  });

  emitStockUpdate();
  res.status(201).json(cautela);
});

cautelasRouter.get("/:id/pdf", requireAuth, async (req: AuthedRequest, res) => {
  const cautela = await prisma.cautela.findUnique({
    where: { id: req.params.id },
    include: { user: true, items: { include: { item: true }, orderBy: { id: "asc" } } },
  });
  if (!cautela) return res.status(404).json({ error: "Cautela não encontrada" });
  if (cautela.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas o responsável ou um administrador pode baixar este documento" });
  }

  const pdfBytes = await generateCautelaPdf(cautela);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="cautela-${cautela.id}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});

cautelasRouter.post("/items/:cautelaItemId/devolver", requireAuth, async (req: AuthedRequest, res) => {
  const { toUnavailable, returnNotes } = req.body ?? {};
  const cautelaItem = await prisma.cautelaItem.findUnique({
    where: { id: req.params.cautelaItemId },
    include: { cautela: true },
  });
  if (!cautelaItem) return res.status(404).json({ error: "Item da cautela não encontrado" });
  if (cautelaItem.status === "DEVOLVIDA") {
    return res.status(409).json({ error: "Este item já foi devolvido" });
  }
  if (cautelaItem.cautela.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas o responsável ou um administrador pode devolver" });
  }

  const targetField = toUnavailable ? "quantityUnavailable" : "quantityAvailable";

  const [updated] = await prisma.$transaction([
    prisma.cautelaItem.update({
      where: { id: cautelaItem.id },
      data: { status: "DEVOLVIDA", returnedAt: new Date(), returnNotes: returnNotes?.trim() || null },
      include: { item: { include: { category: true } } },
    }),
    prisma.item.update({
      where: { id: cautelaItem.itemId },
      data: { quantityCheckedOut: { decrement: cautelaItem.quantity }, [targetField]: { increment: cautelaItem.quantity } },
    }),
  ]);

  emitStockUpdate();
  res.json(updated);
});

cautelasRouter.post("/:id/devolver", requireAuth, async (req: AuthedRequest, res) => {
  const { toUnavailable, returnNotes } = req.body ?? {};
  const cautela = await prisma.cautela.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!cautela) return res.status(404).json({ error: "Cautela não encontrada" });
  if (cautela.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas o responsável ou um administrador pode devolver" });
  }

  const pendentes = cautela.items.filter((i) => i.status === "ATIVA");
  if (pendentes.length === 0) {
    return res.status(409).json({ error: "Todos os itens desta cautela já foram devolvidos" });
  }

  const targetField = toUnavailable ? "quantityUnavailable" : "quantityAvailable";
  const now = new Date();
  const notes = returnNotes?.trim() || null;

  const ops = pendentes.flatMap((ci) => [
    prisma.cautelaItem.update({
      where: { id: ci.id },
      data: { status: "DEVOLVIDA", returnedAt: now, returnNotes: notes },
    }),
    prisma.item.update({
      where: { id: ci.itemId },
      data: { quantityCheckedOut: { decrement: ci.quantity }, [targetField]: { increment: ci.quantity } },
    }),
  ]);
  await prisma.$transaction(ops);

  const updated = await prisma.cautela.findUnique({ where: { id: cautela.id }, include: CAUTELA_INCLUDE });
  emitStockUpdate();
  res.json(updated);
});
