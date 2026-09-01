import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, matricula: true, graduacao: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { name, email, matricula, graduacao } = req.body ?? {};
  const data: { name?: string; email?: string; matricula?: string | null; graduacao?: string | null } = {};

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: "Nome não pode ficar vazio" });
    data.name = String(name).trim();
  }
  if (email !== undefined) {
    const trimmed = String(email).trim();
    if (!trimmed) return res.status(400).json({ error: "E-mail não pode ficar vazio" });
    const existing = await prisma.user.findUnique({ where: { email: trimmed } });
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
    }
    data.email = trimmed;
  }
  if (matricula !== undefined) data.matricula = String(matricula).trim() || null;
  if (graduacao !== undefined) data.graduacao = String(graduacao).trim() || null;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, matricula: true, graduacao: true, role: true },
  });
  res.json(user);
});

usersRouter.patch("/:id/role", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { role } = req.body ?? {};
  if (!["ADMIN", "USER"].includes(role)) {
    return res.status(400).json({ error: "Papel inválido" });
  }
  if (req.params.id === req.user!.userId && role !== "ADMIN") {
    return res.status(409).json({ error: "Você não pode remover seu próprio acesso de administrador" });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, name: true, email: true, matricula: true, role: true },
  });
  res.json(user);
});
