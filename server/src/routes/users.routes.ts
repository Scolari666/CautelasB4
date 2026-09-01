import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const usersRouter = Router();

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  matricula: true,
  graduacao: true,
  role: true,
  createdAt: true,
} as const;

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });
  res.json(users);
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, username, password, email, matricula, graduacao, role } = req.body ?? {};
  if (!name?.trim() || !username?.trim() || !password) {
    return res.status(400).json({ error: "Nome, usuário e senha são obrigatórios" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres" });
  }
  if (role && !["ADMIN", "USER"].includes(role)) {
    return res.status(400).json({ error: "Papel inválido" });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existing) {
    return res.status(409).json({ error: "Já existe uma conta com esse nome de usuário" });
  }

  const trimmedEmail = email ? String(email).trim() : null;
  if (trimmedEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingEmail) return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      username: normalizedUsername,
      email: trimmedEmail,
      matricula: matricula?.trim() || null,
      graduacao: graduacao?.trim() || null,
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    },
    select: USER_SELECT,
  });
  res.status(201).json(user);
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { name, username, email, matricula, graduacao } = req.body ?? {};
  const data: {
    name?: string;
    username?: string;
    email?: string | null;
    matricula?: string | null;
    graduacao?: string | null;
  } = {};

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: "Nome não pode ficar vazio" });
    data.name = String(name).trim();
  }
  if (username !== undefined) {
    const normalized = String(username).trim().toLowerCase();
    if (!normalized) return res.status(400).json({ error: "Usuário não pode ficar vazio" });
    const existing = await prisma.user.findUnique({ where: { username: normalized } });
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: "Já existe uma conta com esse nome de usuário" });
    }
    data.username = normalized;
  }
  if (email !== undefined) {
    const trimmed = String(email).trim();
    if (trimmed) {
      const existing = await prisma.user.findUnique({ where: { email: trimmed } });
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
      }
    }
    data.email = trimmed || null;
  }
  if (matricula !== undefined) data.matricula = String(matricula).trim() || null;
  if (graduacao !== undefined) data.graduacao = String(graduacao).trim() || null;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: USER_SELECT,
  });
  res.json(user);
});

usersRouter.patch("/:id/password", requireAuth, requireAdmin, async (req, res) => {
  const { password } = req.body ?? {};
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
  res.status(204).end();
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
    select: USER_SELECT,
  });
  res.json(user);
});
