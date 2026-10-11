import { z } from "zod";

// ─── Tier Definitions ─────────────────────────────────────────────────
export interface TierDef {
  name: string;
  color: string;
  voiceLine: string;
}

export const TIER_RATIOS = [0.2, 0.4, 0.6, 0.8, 1.0] as const; // fractions of target

export const TIERS: TierDef[] = [
  {
    name: "Awakened",
    color: "#00BFFF",
    voiceLine: "Power rising. {km} km combined. You are Awakened.",
  },
  {
    name: "Kaioken",
    color: "#FF4500",
    voiceLine: "Kaioken! {km} km down. Limits broken.",
  },
  {
    name: "Super Syana",
    color: "#FFD700",
    voiceLine: "Aura on. {km} km. Super Syana!",
  },
  {
    name: "Syana 2",
    color: "#7B68EE",
    voiceLine: "Lightning crackles. {km} km. Syana 2.",
  },
  {
    name: "God Mode",
    color: "#FF1493",
    voiceLine: "Final form. {km} km. God Mode unlocked.",
  },
];

// Scale factors: fewer runners → lower thresholds so God Mode stays reachable
export const SCALE_FACTORS: Record<number, number> = {
  1: 0.3,
  2: 0.5,
  3: 0.7,
};

export function getScaleFactor(groupSize: number): number {
  return SCALE_FACTORS[groupSize] ?? 1.0;
}

/**
 * Build the concrete km thresholds for a room based on its target and size.
 * Returns an array of { thresholdKm, tier } objects.
 */
export function buildTierThresholds(
  targetKm: number,
  groupSize: number
): Array<{ thresholdKm: number; tier: TierDef }> {
  const scale = getScaleFactor(groupSize);
  const effectiveTarget = targetKm * scale;
  return TIERS.map((tier, i) => ({
    thresholdKm: parseFloat((effectiveTarget * TIER_RATIOS[i]).toFixed(1)),
    tier,
  }));
}

// ─── GPS Point Schema ─────────────────────────────────────────────────
export const GpsPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  ts: z.number().int().positive(), // unix epoch seconds
  acc: z.number().nonnegative(), // accuracy in meters
});
export type GpsPoint = z.infer<typeof GpsPointSchema>;

export const PointBatchSchema = z.object({
  batch: z.array(GpsPointSchema).min(1).max(20),
});
export type PointBatch = z.infer<typeof PointBatchSchema>;

// ─── Room Types ───────────────────────────────────────────────────────
export type RoomStatus = "lobby" | "live" | "ended" | "expired";

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  targetKm: number;
  members: Map<string, MemberState>;
  unlockedTiers: Set<string>;
  currentTier: string;
  createdAt: number; // unix ms
  startedAt?: number;
  endedAt?: number;
}

export interface MemberState {
  userId: string;
  displayName: string;
  distanceM: number;
  lastPoint: GpsPoint | null;
  trail: Array<[number, number]>; // [lon, lat][]
  joinedAt: number;
}

// ─── WebSocket Events ─────────────────────────────────────────────────
export interface ServerToClientEvents {
  state: (data: RoomStatePayload) => void;
  tier_unlocked: (data: TierUnlockPayload) => void;
  member_joined: (data: { id: string; name: string }) => void;
  member_left: (data: { id: string; name: string }) => void;
  run_started: (data: { startedAt: string }) => void;
  run_ended: (data: RunEndedPayload) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  points: (data: { batch: GpsPoint[] }) => void;
  ping: () => void;
}

export interface RoomStatePayload {
  totalKm: number;
  currentTier: string;
  members: Array<{
    id: string;
    name: string;
    km: number;
    lat: number | null;
    lon: number | null;
    trail?: Array<[number, number]>;
  }>;
}

export interface TierUnlockPayload {
  tier: string;
  color: string;
  thresholdKm: number;
  totalKm: number;
  voiceLine: string;
  triggeredBy: string;
}

export interface RunEndedPayload {
  totalKm: number;
  finalTier: string;
  durationS: number;
  areaKm2: number;
  hullGeoJson: object | null;
  story: string;
  members: Array<{
    id: string;
    name: string;
    km: number;
    badges: string[];
  }>;
}

// ─── Badges ───────────────────────────────────────────────────────────
export type BadgeName =
  | "Top Contributor"
  | "Final Push"
  | "Iron Will"
  | "First Blood"
  | "Explorer"
  | "Steady Pace";
