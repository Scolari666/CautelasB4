import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, matricula: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
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
