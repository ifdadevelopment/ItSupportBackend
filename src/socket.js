// backend/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }, // adjust in production
  });

  io.on("connection", (socket) => {
    // Register user
    // Disconnect
    socket.on("disconnect", () => {
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
