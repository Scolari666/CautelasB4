import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { emitStockUpdate } from "../socket";

export const itemsRouter = Router();

const MAX_PHOTO_LENGTH = 2_000_000;

itemsRouter.get("/", requireAuth, async (req, res) => {
  const { categoryId, estoqueId } = req.query;
  const items = await prisma.item.findMany({
    where: {
      categoryId: categoryId ? String(categoryId) : undefined,
      estoqueId: estoqueId ? String(estoqueId) : undefined,
    },
    include: { category: true, estoque: true },
    orderBy: { name: "asc" },
  });
  res.json(items);
});

itemsRouter.get("/:id", requireAuth, async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      estoque: true,
      cautelaItems: {
        orderBy: { cautela: { takenAt: "desc" } },
        include: {
          cautela: { include: { user: { select: { id: true, name: true, matricula: true } } } },
        },
      },
    },
  });
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  res.json(item);
});

itemsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, photo, categoryId, estoqueId, quantityTotal } = req.body ?? {};
  if (!name?.trim() || !categoryId || !estoqueId || quantityTotal == null) {
    return res.status(400).json({ error: "Nome, categoria, estoque e quantidade são obrigatórios" });
  }
  const qty = Number(quantityTotal);
  if (!Number.isFinite(qty) || qty < 0) {
    return res.status(400).json({ error: "Quantidade inválida" });
  }
  if (photo && String(photo).length > MAX_PHOTO_LENGTH) {
    return res.status(400).json({ error: "Foto muito grande. Escolha uma imagem menor." });
  }

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      photo: photo || null,
      categoryId,
      estoqueId,
      quantityTotal: qty,
      quantityAvailable: qty,
    },
    include: { category: true, estoque: true },
  });
  emitStockUpdate();
  res.status(201).json(item);
});

itemsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, photo, categoryId, estoqueId, quantityTotal } = req.body ?? {};
  const current = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: "Item não encontrado" });

  if (photo && String(photo).length > MAX_PHOTO_LENGTH) {
    return res.status(400).json({ error: "Foto muito grande. Escolha uma imagem menor." });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (photo !== undefined) data.photo = photo || null;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (estoqueId !== undefined) data.estoqueId = estoqueId;

  if (quantityTotal !== undefined) {
    const qty = Number(quantityTotal);
    if (!Number.isFinite(qty) || qty < 0) {
      return res.status(400).json({ error: "Quantidade inválida" });
    }
    const committed = current.quantityCheckedOut + current.quantityUnavailable;
    if (qty < committed) {
      return res.status(409).json({
        error: `Não é possível reduzir para ${qty}: ${committed} unidade(s) já cautelada(s) ou F.A`,
      });
    }
    data.quantityTotal = qty;
    data.quantityAvailable = qty - committed;
  }

  const item = await prisma.item.update({ where: { id: req.params.id }, data, include: { category: true, estoque: true } });
  emitStockUpdate();
  res.json(item);
});

itemsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  if (item.quantityCheckedOut > 0) {
    return res.status(409).json({ error: "Não é possível remover item com unidades cauteladas" });
  }
  await prisma.item.delete({ where: { id: req.params.id } });
  emitStockUpdate();
  res.status(204).end();
});

itemsRouter.patch("/:id/adjust", requireAuth, requireAdmin, async (req, res) => {
  const { to, quantity } = req.body ?? {};
  const qty = Number(quantity);
  if (!["AVAILABLE", "UNAVAILABLE"].includes(to) || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Item não encontrado" });

  const from = to === "AVAILABLE" ? "quantityUnavailable" : "quantityAvailable";
  const target = to === "AVAILABLE" ? "quantityAvailable" : "quantityUnavailable";

  if ((item as any)[from] < qty) {
    return res.status(409).json({ error: "Quantidade indisponível para essa movimentação" });
  }

  const updated = await prisma.item.update({
    where: { id: req.params.id },
    data: { [from]: { decrement: qty }, [target]: { increment: qty } },
    include: { category: true, estoque: true },
  });
  emitStockUpdate();
  res.json(updated);
});
