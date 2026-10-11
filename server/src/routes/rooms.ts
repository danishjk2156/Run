import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomByCode,
  startRoom,
  stopRoom,
  kickMember,
  serializeRoomFull,
} from "../services/room-service.js";
import { computeRunResult } from "../services/result-service.js";

const router = Router();

// ─── Create Room ──────────────────────────────────────────────────────
router.post("/rooms", (req: Request, res: Response) => {
  try {
    const { displayName, targetKm, deviceId } = req.body;
    if (!displayName || typeof displayName !== "string") {
      res.status(400).json({ error: "displayName is required" });
      return;
    }

    const userId = deviceId || uuidv4();
    const target = typeof targetKm === "number" && targetKm > 0 ? targetKm : 50;
    const room = createRoom(userId, displayName, target);

    res.status(201).json({
      roomId: room.id,
      code: room.code,
      userId,
      room: serializeRoomFull(room),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Join Room ────────────────────────────────────────────────────────
router.post("/rooms/join", (req: Request, res: Response) => {
  try {
    const { code, displayName, deviceId } = req.body;
    if (!code || !displayName) {
      res.status(400).json({ error: "code and displayName are required" });
      return;
    }

    const userId = deviceId || uuidv4();
    const room = joinRoom(code, userId, displayName);

    res.status(200).json({
      roomId: room.id,
      code: room.code,
      userId,
      room: serializeRoomFull(room),
    });
  } catch (err: any) {
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ─── Get Room ─────────────────────────────────────────────────────────
router.get("/rooms/:id", (req: Request, res: Response) => {
  const room = getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({ room: serializeRoomFull(room) });
});

// ─── Start Run ────────────────────────────────────────────────────────
router.post("/rooms/:id/start", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const room = startRoom(req.params.id, userId);
    res.json({ ok: true, room: serializeRoomFull(room) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Stop Run ─────────────────────────────────────────────────────────
router.post("/rooms/:id/stop", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    const room = stopRoom(req.params.id, userId);
    const result = computeRunResult(room);
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Kick Member ──────────────────────────────────────────────────────
router.post("/rooms/:id/kick", (req: Request, res: Response) => {
  try {
    const { userId, targetUserId } = req.body;
    if (!userId || !targetUserId) {
      res.status(400).json({ error: "userId and targetUserId are required" });
      return;
    }
    kickMember(req.params.id, userId, targetUserId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Get Result ───────────────────────────────────────────────────────
router.get("/rooms/:id/result", (req: Request, res: Response) => {
  const room = getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.status !== "ended") {
    res.status(400).json({ error: "Run has not ended yet" });
    return;
  }
  const result = computeRunResult(room);
  res.json({ result });
});

export default router;
