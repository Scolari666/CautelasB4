import { randomUUID } from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { emitStockUpdate } from "../socket";
import { generateCautelaPdf } from "../lib/cautelaPdf";

const MAX_ITENS_POR_CAUTELA = 12;

export const cautelasRouter = Router();

cautelasRouter.get("/", requireAuth, async (req, res) => {
  const { status, userId, itemId } = req.query;
  const cautelas = await prisma.cautela.findMany({
    where: {
      status: status ? (String(status) as "ATIVA" | "DEVOLVIDA") : undefined,
      userId: userId ? String(userId) : undefined,
      itemId: itemId ? String(itemId) : undefined,
    },
    include: {
      item: { include: { category: true } },
      user: { select: { id: true, name: true, matricula: true } },
    },
    orderBy: { takenAt: "desc" },
  });
  res.json(cautelas);
});

cautelasRouter.get("/minhas", requireAuth, async (req: AuthedRequest, res) => {
  const cautelas = await prisma.cautela.findMany({
    where: { userId: req.user!.userId },
    include: { item: { include: { category: true } } },
    orderBy: { takenAt: "desc" },
  });
  res.json(cautelas);
});

cautelasRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { itemId, quantity, purpose, expectedReturnAt } = req.body ?? {};
  const qty = Number(quantity);
  if (!itemId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Item e quantidade válida são obrigatórios" });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  if (item.quantityAvailable < qty) {
    return res.status(409).json({ error: `Apenas ${item.quantityAvailable} unidade(s) disponível(is)` });
  }

  const [cautela] = await prisma.$transaction([
    prisma.cautela.create({
      data: {
        itemId,
        userId: req.user!.userId,
        quantity: qty,
        purpose: purpose?.trim() || null,
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
      },
      include: { item: { include: { category: true } }, user: { select: { id: true, name: true, matricula: true } } },
    }),
    prisma.item.update({
      where: { id: itemId },
      data: { quantityAvailable: { decrement: qty }, quantityCheckedOut: { increment: qty } },
    }),
  ]);

  emitStockUpdate();
  res.status(201).json(cautela);
});

cautelasRouter.post("/batch", requireAuth, async (req: AuthedRequest, res) => {
  const { items, purpose, expectedReturnAt } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Informe ao menos um item" });
  }
  if (items.length > MAX_ITENS_POR_CAUTELA) {
    return res.status(400).json({ error: `A cautela combinada suporta no máximo ${MAX_ITENS_POR_CAUTELA} itens` });
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
    return res.status(400).json({ error: "Cada item só pode aparecer uma vez na cautela combinada" });
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

  const groupId = randomUUID();
  const cautelaData = {
    userId: req.user!.userId,
    purpose: purpose?.trim() || null,
    expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
    groupId,
  };
  const ops = parsed.flatMap((p) => [
    prisma.cautela.create({
      data: { ...cautelaData, itemId: p.itemId, quantity: p.quantity },
      include: { item: { include: { category: true } }, user: { select: { id: true, name: true, matricula: true } } },
    }),
    prisma.item.update({
      where: { id: p.itemId },
      data: { quantityAvailable: { decrement: p.quantity }, quantityCheckedOut: { increment: p.quantity } },
    }),
  ]);

  const results = await prisma.$transaction(ops);
  const createdCautelas = results.filter((_, idx) => idx % 2 === 0);

  emitStockUpdate();
  res.status(201).json(createdCautelas);
});

cautelasRouter.get("/:id/pdf", requireAuth, async (req: AuthedRequest, res) => {
  const primary = await prisma.cautela.findUnique({
    where: { id: req.params.id },
    include: { item: true, user: true },
  });
  if (!primary) return res.status(404).json({ error: "Cautela não encontrada" });
  if (primary.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas o responsável ou um administrador pode baixar este documento" });
  }

  const group = primary.groupId
    ? await prisma.cautela.findMany({
        where: { groupId: primary.groupId },
        include: { item: true, user: true },
        orderBy: { takenAt: "asc" },
      })
    : [primary];

  const pdfBytes = await generateCautelaPdf(group);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="cautela-${primary.id}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});

cautelasRouter.post("/:id/devolver", requireAuth, async (req: AuthedRequest, res) => {
  const { toUnavailable, returnNotes } = req.body ?? {};
  const cautela = await prisma.cautela.findUnique({ where: { id: req.params.id } });
  if (!cautela) return res.status(404).json({ error: "Cautela não encontrada" });
  if (cautela.status === "DEVOLVIDA") {
    return res.status(409).json({ error: "Cautela já foi devolvida" });
  }
  if (cautela.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas o responsável ou um administrador pode devolver" });
  }

  const targetField = toUnavailable ? "quantityUnavailable" : "quantityAvailable";

  const [updatedCautela] = await prisma.$transaction([
    prisma.cautela.update({
      where: { id: cautela.id },
      data: { status: "DEVOLVIDA", returnedAt: new Date(), returnNotes: returnNotes?.trim() || null },
      include: { item: { include: { category: true } }, user: { select: { id: true, name: true, matricula: true } } },
    }),
    prisma.item.update({
      where: { id: cautela.itemId },
      data: { quantityCheckedOut: { decrement: cautela.quantity }, [targetField]: { increment: cautela.quantity } },
    }),
  ]);

  emitStockUpdate();
  res.json(updatedCautela);
});
