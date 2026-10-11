import type { Server as SocketServer } from "socket.io";
import {
  buildTierThresholds,
  type RoomState,
  type TierUnlockPayload,
  type ServerToClientEvents,
  type ClientToServerEvents,
} from "../types.js";

/**
 * Check if any new tiers should unlock for the room.
 * Broadcasts `tier_unlocked` for each newly crossed threshold.
 * Returns the list of tiers that were just unlocked.
 */
export function checkTierUnlocks(
  room: RoomState,
  triggeredByUserId: string,
  triggeredByName: string,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
): TierUnlockPayload[] {
  const thresholds = buildTierThresholds(room.targetKm, room.members.size);
  const totalKm = getRoomTotalKm(room);
  const unlocked: TierUnlockPayload[] = [];

  for (const { thresholdKm, tier } of thresholds) {
    if (totalKm >= thresholdKm && !room.unlockedTiers.has(tier.name)) {
      // Mark as unlocked (idempotent guard)
      room.unlockedTiers.add(tier.name);
      room.currentTier = tier.name;

      const payload: TierUnlockPayload = {
        tier: tier.name,
        color: tier.color,
        thresholdKm,
        totalKm: parseFloat(totalKm.toFixed(2)),
        voiceLine: tier.voiceLine.replace("{km}", totalKm.toFixed(1)),
        triggeredBy: triggeredByName,
      };

      // Broadcast to the room
      io.to(room.id).emit("tier_unlocked", payload);
      unlocked.push(payload);

      console.log(
        `🏆 [${room.code}] Tier unlocked: ${tier.name} at ${totalKm.toFixed(1)} km (triggered by ${triggeredByName})`
      );
    }
  }

  return unlocked;
}

/**
 * Get the total distance across all members in km.
 */
export function getRoomTotalKm(room: RoomState): number {
  let totalM = 0;
  for (const member of room.members.values()) {
    totalM += member.distanceM;
  }
  return totalM / 1000;
}

/**
 * Get the highest unlocked tier name, or "Base Form" if none.
 */
export function getCurrentTier(room: RoomState): string {
  if (room.unlockedTiers.size === 0) return "Base Form";
  return room.currentTier;
}
