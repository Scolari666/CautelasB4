import { Router } from "express";
import type { MissaoStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const missoesRouter = Router();

const MISSAO_INCLUDE = {
  assignedTo: { select: { id: true, name: true, matricula: true, pelotao: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

const MISSAO_STATUSES = ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];

missoesRouter.get("/", requireAuth, async (req, res) => {
  const { status, minhas } = req.query;
  const userId = (req as AuthedRequest).user!.userId;
  const missoes = await prisma.missao.findMany({
    where: {
      status: status ? (String(status) as MissaoStatus) : undefined,
      assignedToId: minhas === "true" ? userId : undefined,
    },
    include: MISSAO_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(missoes);
});

missoesRouter.post("/", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { title, description, status, startAt, endAt, assignedToId } = req.body ?? {};
  if (!title?.trim()) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }
  if (status && !MISSAO_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }
  if (assignedToId) {
    const user = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) return res.status(404).json({ error: "Usuário atribuído não encontrado" });
  }

  const missao = await prisma.missao.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "PLANEJADA",
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      assignedToId: assignedToId || null,
      createdById: req.user!.userId,
    },
    include: MISSAO_INCLUDE,
  });
  res.status(201).json(missao);
});

missoesRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, status, startAt, endAt, assignedToId } = req.body ?? {};
  if (status && !MISSAO_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }
  if (assignedToId) {
    const user = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!user) return res.status(404).json({ error: "Usuário atribuído não encontrado" });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: "Título não pode ficar vazio" });
    data.title = String(title).trim();
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (status !== undefined) data.status = status;
  if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null;
  if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;
  if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

  const missao = await prisma.missao.update({
    where: { id: req.params.id },
    data,
    include: MISSAO_INCLUDE,
  });
  res.json(missao);
});

missoesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.missao.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
