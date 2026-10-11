import type { Server as SocketServer, Socket } from "socket.io";
import { PointBatchSchema } from "../types.js";
import type { ServerToClientEvents, ClientToServerEvents } from "../types.js";
import {
  getRoom,
  getRoomByCode,
  serializeRoomState,
  removeMember,
} from "../services/room-service.js";
import { processBatch } from "../services/gps-service.js";
import { checkTierUnlocks, getRoomTotalKm } from "../services/tier-engine.js";
import { computeRunResult } from "../services/result-service.js";

// Track which socket belongs to which room/user
interface SocketMeta {
  roomId: string;
  userId: string;
  displayName: string;
}
const socketMeta = new Map<string, SocketMeta>();

// Broadcast state every N ms while room is live
const STATE_BROADCAST_INTERVAL_MS = 5000;
const roomIntervals = new Map<string, ReturnType<typeof setInterval>>();

export function setupWebSocket(
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const { roomId, userId, displayName } = socket.handshake.query as Record<
      string,
      string
    >;

    if (!roomId || !userId) {
      socket.emit("error", { message: "roomId and userId are required" });
      socket.disconnect();
      return;
    }

    const room = getRoom(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      socket.disconnect();
      return;
    }

    // Verify user is a member
    const member = room.members.get(userId);
    if (!member) {
      socket.emit("error", { message: "You are not a member of this room" });
      socket.disconnect();
      return;
    }

    // Join the Socket.io room
    socket.join(roomId);
    socketMeta.set(socket.id, { roomId, userId, displayName: member.displayName });

    console.log(
      `🔌 ${member.displayName} connected to room ${room.code} (socket=${socket.id})`
    );

    // Notify others
    socket.to(roomId).emit("member_joined", {
      id: userId,
      name: member.displayName,
    });

    // Send current state to the joiner
    socket.emit("state", serializeRoomState(room));

    // Start periodic broadcasts if room is live and no interval exists yet
    if (room.status === "live" && !roomIntervals.has(roomId)) {
      startBroadcast(io, roomId);
    }

    // ─── Handle GPS Point Batches ─────────────────────────────────────
    socket.on("points", (data) => {
      const room = getRoom(roomId);
      if (!room || room.status !== "live") return;

      const member = room.members.get(userId);
      if (!member) return;

      // Validate with Zod
      const parsed = PointBatchSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", {
          message: `Invalid point batch: ${parsed.error.message}`,
        });
        return;
      }

      // Process batch through GPS pipeline
      const { addedM, accepted, rejected } = processBatch(
        parsed.data.batch,
        member
      );

      if (accepted > 0) {
        // Check for tier unlocks
        checkTierUnlocks(room, userId, member.displayName, io);

        // Log progress periodically
        const totalKm = getRoomTotalKm(room);
        if (Math.random() < 0.1) {
          // Log ~10% of batches
          console.log(
            `📍 [${room.code}] ${member.displayName}: +${(addedM / 1000).toFixed(2)} km | ` +
              `Personal: ${(member.distanceM / 1000).toFixed(2)} km | ` +
              `Room: ${totalKm.toFixed(2)} km | ` +
              `${accepted} accepted, ${rejected} rejected`
          );
        }
      }
    });

    // ─── Heartbeat ────────────────────────────────────────────────────
    socket.on("ping", () => {
      // Just keeps the connection alive, no response needed
    });

    // ─── Disconnect ───────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        console.log(
          `🔌 ${meta.displayName} disconnected from room (socket=${socket.id})`
        );
        socket.to(meta.roomId).emit("member_left", {
          id: meta.userId,
          name: meta.displayName,
        });
        socketMeta.delete(socket.id);
      }
    });
  });
}

function startBroadcast(
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): void {
  const interval = setInterval(() => {
    const room = getRoom(roomId);
    if (!room || room.status !== "live") {
      clearInterval(interval);
      roomIntervals.delete(roomId);
      return;
    }
    io.to(roomId).emit("state", serializeRoomState(room));
  }, STATE_BROADCAST_INTERVAL_MS);

  roomIntervals.set(roomId, interval);
}

/**
 * Broadcast run_ended to all sockets in a room and stop the broadcast interval.
 */
export function broadcastRunEnded(
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): void {
  const room = getRoom(roomId);
  if (!room) return;

  // Stop periodic broadcasts
  const interval = roomIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    roomIntervals.delete(roomId);
  }

  const result = computeRunResult(room);
  io.to(roomId).emit("run_ended", result);
}
