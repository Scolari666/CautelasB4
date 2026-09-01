import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | undefined;

export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: "*" } });
  return io;
}

export function emitStockUpdate() {
  io?.emit("stock:update");
}
