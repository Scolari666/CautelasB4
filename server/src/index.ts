import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { initSocket } from "./socket";
import { authRouter } from "./routes/auth.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { estoquesRouter } from "./routes/estoques.routes";
import { itemsRouter } from "./routes/items.routes";
import { cautelasRouter } from "./routes/cautelas.routes";
import { usersRouter } from "./routes/users.routes";
import { missoesRouter } from "./routes/missoes.routes";
import { pedidosRouter } from "./routes/pedidos.routes";
import { autosInfracaoRouter } from "./routes/autosInfracao.routes";

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/estoques", estoquesRouter);
app.use("/api/items", itemsRouter);
app.use("/api/cautelas", cautelasRouter);
app.use("/api/users", usersRouter);
app.use("/api/missoes", missoesRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/autos-infracao", autosInfracaoRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
httpServer.listen(PORT, () => {
  console.log(`CautelasB4 server rodando na porta ${PORT}`);
});
