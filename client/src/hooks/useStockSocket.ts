import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io({ autoConnect: false, transports: ["websocket", "polling"] });

export function useStockSocket(onUpdate: () => void) {
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on("stock:update", onUpdate);
    return () => {
      socket.off("stock:update", onUpdate);
    };
  }, [onUpdate]);
}
