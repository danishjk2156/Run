import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { config } from "./config.js";
import roomRoutes from "./routes/rooms.js";
import { setupWebSocket, broadcastRunEnded } from "./routes/ws.js";
import { getRoom, startRoom, stopRoom, serializeRoomFull } from "./services/room-service.js";
import type { ServerToClientEvents, ClientToServerEvents } from "./types.js";

// ─── Express App ──────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// API routes
app.use("/api", roomRoutes);

// Override the stop route to also broadcast via WS
app.post("/api/rooms/:id/stop-and-broadcast", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const room = stopRoom(req.params.id, userId);
    broadcastRunEnded(io, room.id);
    res.json({ ok: true, room: serializeRoomFull(room) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── HTTP + Socket.io Server ──────────────────────────────────────────
const httpServer = createServer(app);
const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

// Setup WebSocket handlers
setupWebSocket(io);

// Broadcast run_started when host starts
app.post("/api/rooms/:id/start-and-broadcast", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const room = startRoom(req.params.id, userId);
    io.to(room.id).emit("run_started", {
      startedAt: new Date(room.startedAt!).toISOString(),
    });
    res.json({ ok: true, room: serializeRoomFull(room) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║      🏃 Touch Grass Relay Server 🏃          ║
  ║──────────────────────────────────────────────║
  ║  REST:      http://localhost:${config.port}/api     ║
  ║  WebSocket: ws://localhost:${config.port}           ║
  ║  Health:    http://localhost:${config.port}/health   ║
  ╚══════════════════════════════════════════════╝
  `);
});

export { io };
