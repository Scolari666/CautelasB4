import { Router } from "express";
import type { PedidoStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const pedidosRouter = Router();

const MAX_ITENS_POR_PEDIDO = 20;
const PEDIDO_STATUSES = ["PENDENTE", "APROVADO", "RECUSADO", "ATENDIDO"];

const PEDIDO_INCLUDE = {
  requestedBy: { select: { id: true, name: true, matricula: true, pelotao: true } },
  items: { include: { item: { include: { category: true, estoque: true } } } },
} as const;

pedidosRouter.get("/", requireAuth, async (req, res) => {
  const { status, pelotao } = req.query;
  const pedidos = await prisma.pedido.findMany({
    where: {
      status: status ? (String(status) as PedidoStatus) : undefined,
      pelotao: pelotao ? String(pelotao) : undefined,
    },
    include: PEDIDO_INCLUDE,
    orderBy: { neededAt: "asc" },
  });
  res.json(pedidos);
});

pedidosRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { pelotao, instrucao, neededAt, items, notes } = req.body ?? {};
  if (!pelotao?.trim() || !instrucao?.trim() || !neededAt) {
    return res.status(400).json({ error: "Pelotão, instrução e data são obrigatórios" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Informe ao menos um material" });
  }
  if (items.length > MAX_ITENS_POR_PEDIDO) {
    return res.status(400).json({ error: `Um pedido suporta no máximo ${MAX_ITENS_POR_PEDIDO} materiais` });
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
    return res.status(400).json({ error: "Cada material só pode aparecer uma vez no mesmo pedido" });
  }
  const dbItems = await prisma.item.findMany({ where: { id: { in: itemIds } } });
  if (dbItems.length !== itemIds.length) {
    return res.status(404).json({ error: "Um ou mais materiais não foram encontrados" });
  }

  const pedido = await prisma.pedido.create({
    data: {
      pelotao: pelotao.trim(),
      instrucao: instrucao.trim(),
      neededAt: new Date(neededAt),
      notes: notes?.trim() || null,
      requestedById: req.user!.userId,
      items: { create: parsed.map((p) => ({ itemId: p.itemId, quantity: p.quantity })) },
    },
    include: PEDIDO_INCLUDE,
  });
  res.status(201).json(pedido);
});

pedidosRouter.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body ?? {};
  if (!PEDIDO_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }
  const pedido = await prisma.pedido.update({
    where: { id: req.params.id },
    data: { status },
    include: PEDIDO_INCLUDE,
  });
  res.json(pedido);
});

pedidosRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
  if (!pedido) return res.status(404).json({ error: "Pedido não encontrado" });
  const isOwner = pedido.requestedById === req.user!.userId;
  if (!isOwner && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas quem solicitou ou um administrador pode remover" });
  }
  if (isOwner && req.user!.role !== "ADMIN" && pedido.status !== "PENDENTE") {
    return res.status(409).json({ error: "Só é possível remover pedidos ainda pendentes" });
  }
  await prisma.pedido.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
