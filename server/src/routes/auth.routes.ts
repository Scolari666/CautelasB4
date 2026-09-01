import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/auth";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  const user = await prisma.user.findUnique({ where: { username: String(username).trim().toLowerCase() } });
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      matricula: user.matricula,
      graduacao: user.graduacao,
      telefone: user.telefone,
      pelotao: user.pelotao,
      avatarUrl: user.avatarUrl,
    },
  });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    matricula: user.matricula,
    graduacao: user.graduacao,
    telefone: user.telefone,
    pelotao: user.pelotao,
    avatarUrl: user.avatarUrl,
  });
});
