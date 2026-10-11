import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import type { RoomState, MemberState, RoomStatus } from "../types.js";

// ─── In-Memory Room Store ─────────────────────────────────────────────
// For hackathon: in-memory Map. Production: Redis-backed.
const rooms = new Map<string, RoomState>();
const codeToRoomId = new Map<string, string>();

// ─── Room Code Generation ─────────────────────────────────────────────
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 30 chars, no ambiguous

function generateCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = "";
    for (let i = 0; i < config.roomCodeLength; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    attempts++;
    if (attempts > 100) throw new Error("Failed to generate unique room code");
  } while (codeToRoomId.has(code));
  return code;
}

// ─── Room CRUD ────────────────────────────────────────────────────────

export function createRoom(
  hostId: string,
  hostName: string,
  targetKm: number = config.tierBaseTargetKm
): RoomState {
  const id = uuidv4();
  const code = generateCode();

  const hostMember: MemberState = {
    userId: hostId,
    displayName: hostName,
    distanceM: 0,
    lastPoint: null,
    trail: [],
    joinedAt: Date.now(),
  };

  const room: RoomState = {
    id,
    code,
    hostId,
    status: "lobby",
    targetKm,
    members: new Map([[hostId, hostMember]]),
    unlockedTiers: new Set(),
    currentTier: "Base Form",
    createdAt: Date.now(),
  };

  rooms.set(id, room);
  codeToRoomId.set(code, id);

  console.log(`🏠 Room created: ${code} (id=${id}) by ${hostName}`);
  return room;
}

export function joinRoom(
  code: string,
  userId: string,
  displayName: string
): RoomState {
  const roomId = codeToRoomId.get(code.toUpperCase());
  if (!roomId) throw new Error("Room not found");

  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  if (room.status !== "lobby") {
    throw new Error("Room is not accepting new members");
  }

  if (room.members.size >= config.roomMaxMembers) {
    throw new Error("Room is full");
  }

  if (room.members.has(userId)) {
    // Already in the room, return it
    return room;
  }

  const member: MemberState = {
    userId,
    displayName,
    distanceM: 0,
    lastPoint: null,
    trail: [],
    joinedAt: Date.now(),
  };

  room.members.set(userId, member);
  console.log(`👤 ${displayName} joined room ${room.code}`);
  return room;
}

export function startRoom(roomId: string, userId: string): RoomState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== userId) throw new Error("Only the host can start the run");
  if (room.status !== "lobby") throw new Error("Room is not in lobby");

  room.status = "live";
  room.startedAt = Date.now();

  console.log(`🏃 Room ${room.code} is now LIVE with ${room.members.size} runners`);
  return room;
}

export function stopRoom(roomId: string, userId: string): RoomState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== userId) throw new Error("Only the host can stop the run");
  if (room.status !== "live") throw new Error("Room is not live");

  room.status = "ended";
  room.endedAt = Date.now();

  console.log(`🛑 Room ${room.code} ended. Total: ${getRoomTotalKm(room).toFixed(2)} km`);
  return room;
}

export function kickMember(
  roomId: string,
  hostId: string,
  targetUserId: string
): RoomState {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== hostId) throw new Error("Only the host can kick members");
  if (room.status !== "lobby") throw new Error("Can only kick in lobby");
  if (targetUserId === hostId) throw new Error("Host cannot kick themselves");

  room.members.delete(targetUserId);
  return room;
}

export function removeMember(roomId: string, userId: string): RoomState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.members.delete(userId);
  return room;
}

// ─── Lookups ──────────────────────────────────────────────────────────

export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): RoomState | undefined {
  const roomId = codeToRoomId.get(code.toUpperCase());
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function getRoomTotalKm(room: RoomState): number {
  let totalM = 0;
  for (const member of room.members.values()) {
    totalM += member.distanceM;
  }
  return totalM / 1000;
}

// ─── Serialization ────────────────────────────────────────────────────

export function serializeRoomState(room: RoomState) {
  const members = Array.from(room.members.values()).map((m) => ({
    id: m.userId,
    name: m.displayName,
    km: parseFloat((m.distanceM / 1000).toFixed(2)),
    lat: m.lastPoint?.lat ?? null,
    lon: m.lastPoint?.lon ?? null,
    trail: m.trail || [],
  }));

  return {
    totalKm: parseFloat(getRoomTotalKm(room).toFixed(2)),
    currentTier: room.currentTier,
    members,
  };
}

export function serializeRoomFull(room: RoomState) {
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    targetKm: room.targetKm,
    currentTier: room.currentTier,
    createdAt: new Date(room.createdAt).toISOString(),
    startedAt: room.startedAt
      ? new Date(room.startedAt).toISOString()
      : null,
    endedAt: room.endedAt ? new Date(room.endedAt).toISOString() : null,
    ...serializeRoomState(room),
    unlockedTiers: Array.from(room.unlockedTiers),
  };
}
