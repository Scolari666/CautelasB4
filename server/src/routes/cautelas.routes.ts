import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { emitStockUpdate } from "../socket";

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
