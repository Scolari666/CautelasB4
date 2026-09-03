import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateAutoInfracaoPdf } from "../lib/autoInfracaoPdf";
import { isInfracaoCodigo } from "../lib/infracaoCodigos";

export const autosInfracaoRouter = Router();

const INCLUDE = {
  createdBy: { select: { id: true, name: true, matricula: true, graduacao: true } },
} as const;

const TEXT_FIELDS = [
  "numero",
  "horario",
  "razaoSocial",
  "nomeFantasia",
  "ppciPspci",
  "numeroLogradouro",
  "logradouro",
  "bairro",
  "municipio",
  "complemento",
  "infratorRazaoSocial",
  "infratorCnpj",
  "infratorNome",
  "infratorCpf",
  "infratorTelefone",
  "infratorEmail",
] as const;

function parseBody(body: Record<string, unknown>) {
  const data: Record<string, string | null> = {};
  for (const field of TEXT_FIELDS) {
    const raw = body[field];
    data[field] = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }

  const infracoes = Array.isArray(body.infracoes)
    ? Array.from(new Set(body.infracoes.filter((c): c is string => typeof c === "string" && isInfracaoCodigo(c))))
    : [];

  const dataLavratura = body.dataLavratura ? new Date(body.dataLavratura as string) : new Date();

  return { data, infracoes, dataLavratura };
}

autosInfracaoRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const autos = await prisma.autoInfracao.findMany({
    where: req.user!.role === "ADMIN" ? {} : { createdById: req.user!.userId },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(autos);
});

autosInfracaoRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const auto = await prisma.autoInfracao.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!auto) return res.status(404).json({ error: "Auto de infração não encontrado" });
  if (auto.createdById !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas quem criou ou um administrador pode ver este auto" });
  }
  res.json(auto);
});

autosInfracaoRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const numero = typeof req.body?.numero === "string" ? req.body.numero.trim() : "";
  if (!numero) return res.status(400).json({ error: "Informe o número do auto de infração" });

  const { data, infracoes, dataLavratura } = parseBody(req.body ?? {});

  const auto = await prisma.autoInfracao.create({
    data: { ...data, numero, dataLavratura, infracoes, createdById: req.user!.userId },
    include: INCLUDE,
  });
  res.status(201).json(auto);
});

autosInfracaoRouter.put("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const existing = await prisma.autoInfracao.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Auto de infração não encontrado" });
  if (existing.createdById !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas quem criou ou um administrador pode editar este auto" });
  }

  const numero = typeof req.body?.numero === "string" ? req.body.numero.trim() : "";
  if (!numero) return res.status(400).json({ error: "Informe o número do auto de infração" });

  const { data, infracoes, dataLavratura } = parseBody(req.body ?? {});

  const auto = await prisma.autoInfracao.update({
    where: { id: req.params.id },
    data: { ...data, numero, dataLavratura, infracoes },
    include: INCLUDE,
  });
  res.json(auto);
});

autosInfracaoRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const existing = await prisma.autoInfracao.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Auto de infração não encontrado" });
  if (existing.createdById !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas quem criou ou um administrador pode excluir este auto" });
  }
  await prisma.autoInfracao.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

autosInfracaoRouter.get("/:id/pdf", requireAuth, async (req: AuthedRequest, res) => {
  const auto = await prisma.autoInfracao.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!auto) return res.status(404).json({ error: "Auto de infração não encontrado" });
  if (auto.createdById !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas quem criou ou um administrador pode baixar este documento" });
  }

  const pdfBytes = await generateAutoInfracaoPdf(auto);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="anexo-a-${auto.numero}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});
