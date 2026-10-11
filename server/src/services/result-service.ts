import type { RoomState, BadgeName } from "../types.js";
import { computeArea } from "./gps-service.js";
import { getRoomTotalKm } from "./room-service.js";
import { buildTierThresholds } from "../types.js";

interface MemberResult {
  id: string;
  name: string;
  km: number;
  badges: BadgeName[];
}

interface RunResult {
  totalKm: number;
  finalTier: string;
  durationS: number;
  areaKm2: number;
  hullGeoJson: object | null;
  story: string;
  members: MemberResult[];
}

/**
 * Compute the final run result: badges, area, story.
 */
export function computeRunResult(room: RoomState): RunResult {
  const totalKm = getRoomTotalKm(room);
  const durationS = room.endedAt && room.startedAt
    ? Math.round((room.endedAt - room.startedAt) / 1000)
    : 0;

  // Collect all points for area computation
  const allPoints: Array<{ lat: number; lon: number }> = [];
  const memberResults: MemberResult[] = [];

  for (const member of room.members.values()) {
    const km = parseFloat((member.distanceM / 1000).toFixed(2));
    memberResults.push({
      id: member.userId,
      name: member.displayName,
      km,
      badges: [],
    });

    if (member.lastPoint) {
      allPoints.push({ lat: member.lastPoint.lat, lon: member.lastPoint.lon });
    }
  }

  // Compute area
  const { geoJson: hullGeoJson, areaKm2 } = computeArea(allPoints);

  // ─── Badges ─────────────────────────────────────────────────────────
  if (memberResults.length > 0) {
    // Top Contributor: highest individual km
    const sorted = [...memberResults].sort((a, b) => b.km - a.km);
    sorted[0].badges.push("Top Contributor");

    // First Blood: first to reach 1 km (for now, give to top contributor)
    // In a real implementation, we'd track when each member crossed 1 km
    if (sorted[0].km >= 1) {
      sorted[0].badges.push("First Blood");
    }

    // Iron Will: we approximate with the runner who has the longest consistent distance
    // (In full implementation, we'd analyze point timestamps for gap detection)
    if (memberResults.length > 1) {
      // Give to the runner with the second-highest distance as a diverse badge
      sorted[1]?.badges.push("Iron Will");
    }
  }

  // ─── Story (Template Fallback) ──────────────────────────────────────
  const story = generateStory(room, memberResults, totalKm, durationS);

  return {
    totalKm: parseFloat(totalKm.toFixed(2)),
    finalTier: room.currentTier,
    durationS,
    areaKm2,
    hullGeoJson,
    story,
    members: memberResults,
  };
}

function generateStory(
  room: RoomState,
  members: MemberResult[],
  totalKm: number,
  durationS: number
): string {
  const count = members.length;
  const top = members.reduce((a, b) => (a.km > b.km ? a : b));
  const mins = Math.round(durationS / 60);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  const duration =
    hours > 0 ? `${hours}h ${remMins}min` : `${mins} minutes`;

  const tierText =
    room.currentTier !== "Base Form"
      ? ` and reached ${room.currentTier}`
      : "";

  const runners =
    count === 1
      ? "A lone warrior"
      : count === 2
        ? "Two warriors"
        : `${count} warriors`;

  return (
    `${runners} covered ${totalKm.toFixed(1)} km in ${duration}${tierText}. ` +
    `${top.name} led the charge at ${top.km.toFixed(1)} km. ` +
    `The power level was undeniable.`
  );
}
