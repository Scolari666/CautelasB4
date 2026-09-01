import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { emitStockUpdate } from "../socket";

export const categoriesRouter = Router();

categoriesRouter.get("/", requireAuth, async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  res.json(categories);
});

categoriesRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Nome é obrigatório" });

  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) return res.status(409).json({ error: "Já existe uma categoria com esse nome" });

  const category = await prisma.category.create({ data: { name: name.trim() } });
  emitStockUpdate();
  res.status(201).json(category);
});

categoriesRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Nome é obrigatório" });

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { name: name.trim() },
  });
  emitStockUpdate();
  res.json(category);
});

categoriesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const itemCount = await prisma.item.count({ where: { categoryId: req.params.id } });
  if (itemCount > 0) {
    return res.status(409).json({ error: "Não é possível remover categoria com itens cadastrados" });
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  emitStockUpdate();
  res.status(204).end();
});
