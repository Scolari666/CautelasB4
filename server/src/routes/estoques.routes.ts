import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { emitStockUpdate } from "../socket";

export const estoquesRouter = Router();

estoquesRouter.get("/", requireAuth, async (_req, res) => {
  const estoques = await prisma.estoque.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { items: true } } },
  });
  res.json(estoques);
});

estoquesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Nome é obrigatório" });

  const existing = await prisma.estoque.findUnique({ where: { name: name.trim() } });
  if (existing) return res.status(409).json({ error: "Já existe um estoque com esse nome" });

  const estoque = await prisma.estoque.create({ data: { name: name.trim() } });
  emitStockUpdate();
  res.status(201).json(estoque);
});

estoquesRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Nome é obrigatório" });

  const estoque = await prisma.estoque.update({
    where: { id: req.params.id },
    data: { name: name.trim() },
  });
  emitStockUpdate();
  res.json(estoque);
});

estoquesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const itemCount = await prisma.item.count({ where: { estoqueId: req.params.id } });
  if (itemCount > 0) {
    return res.status(409).json({ error: "Não é possível remover estoque com itens cadastrados" });
  }
  await prisma.estoque.delete({ where: { id: req.params.id } });
  emitStockUpdate();
  res.status(204).end();
});
