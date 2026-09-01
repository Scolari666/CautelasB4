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
  telefone: true,
  pelotao: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

const DIRECTORY_SELECT = {
  id: true,
  name: true,
  graduacao: true,
  telefone: true,
  matricula: true,
  pelotao: true,
  avatarUrl: true,
} as const;

const MAX_AVATAR_LENGTH = 3_000_000;

usersRouter.get("/directory", requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: DIRECTORY_SELECT,
    orderBy: { name: "asc" },
  });
  res.json(users);
});

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });
  res.json(users);
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, username, password, email, matricula, graduacao, telefone, pelotao, role } = req.body ?? {};
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
      telefone: telefone?.trim() || null,
      pelotao: pelotao?.trim() || null,
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    },
    select: USER_SELECT,
  });
  res.status(201).json(user);
});

usersRouter.patch("/me/password", requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "A nova senha deve ter ao menos 6 caracteres" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Senha atual incorreta" });

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.status(204).end();
});

usersRouter.patch("/me/avatar", requireAuth, async (req: AuthedRequest, res) => {
  const { avatarUrl } = req.body ?? {};
  if (avatarUrl === null) {
    await prisma.user.update({ where: { id: req.user!.userId }, data: { avatarUrl: null } });
    return res.status(204).end();
  }
  if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Foto inválida" });
  }
  if (avatarUrl.length > MAX_AVATAR_LENGTH) {
    return res.status(400).json({ error: "Foto muito grande. Escolha uma imagem menor." });
  }
  await prisma.user.update({ where: { id: req.user!.userId }, data: { avatarUrl } });
  res.status(204).end();
});

usersRouter.delete("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.userId) {
    return res.status(409).json({ error: "Você não pode excluir sua própria conta" });
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    if (code === "P2003") {
      return res.status(409).json({
        error: "Não é possível excluir: este usuário possui cautelas, missões ou pedidos registrados no sistema",
      });
    }
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { name, username, email, matricula, graduacao, telefone, pelotao } = req.body ?? {};
  const data: {
    name?: string;
    username?: string;
    email?: string | null;
    matricula?: string | null;
    graduacao?: string | null;
    telefone?: string | null;
    pelotao?: string | null;
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
  if (telefone !== undefined) data.telefone = String(telefone).trim() || null;
  if (pelotao !== undefined) data.pelotao = String(pelotao).trim() || null;

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
