import * as turf from "@turf/turf";
import { config } from "../config.js";
import type { GpsPoint, MemberState } from "../types.js";

const { gps: gpsConfig } = config;

/**
 * Haversine distance in meters between two GPS points.
 * Uses Turf.js under the hood.
 */
export function distanceM(a: GpsPoint, b: GpsPoint): number {
  return turf.distance([a.lon, a.lat], [b.lon, b.lat], {
    units: "meters",
  });
}

/**
 * Implied speed in km/h between two points.
 */
export function impliedSpeedKmh(a: GpsPoint, b: GpsPoint): number {
  const dist = distanceM(a, b);
  const timeDiffS = Math.abs(b.ts - a.ts);
  if (timeDiffS === 0) return Infinity;
  return (dist / timeDiffS) * 3.6; // m/s → km/h
}

/**
 * Validate a single incoming point against the server-side filters.
 *
 * Returns { ok: true, point } if accepted, or { ok: false, reason } if rejected.
 */
export function validatePoint(
  point: GpsPoint,
  member: MemberState
): { ok: true } | { ok: false; reason: string } {
  // 1. Accuracy gate
  if (point.acc > gpsConfig.maxAccuracyM) {
    return { ok: false, reason: `accuracy ${point.acc}m > ${gpsConfig.maxAccuracyM}m` };
  }

  // 2. Timestamp must be newer than last accepted
  if (member.lastPoint && point.ts <= member.lastPoint.ts) {
    return { ok: false, reason: "timestamp not newer than last point" };
  }

  // 3. Rate limit: minimum interval
  if (
    member.lastPoint &&
    point.ts - member.lastPoint.ts < gpsConfig.minIntervalS
  ) {
    return { ok: false, reason: "point too soon" };
  }

  // If we have a previous point, check speed and movement
  if (member.lastPoint) {
    const dist = distanceM(member.lastPoint, point);

    // 4. Minimum movement (prevents drift)
    if (dist < gpsConfig.minMovementM) {
      return { ok: false, reason: `moved only ${dist.toFixed(1)}m < ${gpsConfig.minMovementM}m` };
    }

    // 5. Teleport gate (GPS glitch)
    if (dist > gpsConfig.maxJumpM) {
      return { ok: false, reason: `jump ${dist.toFixed(0)}m > ${gpsConfig.maxJumpM}m` };
    }

    // 6. Speed gate (car/bus detection)
    const speed = impliedSpeedKmh(member.lastPoint, point);
    if (speed > gpsConfig.maxSpeedKmh) {
      return {
        ok: false,
        reason: `speed ${speed.toFixed(1)} km/h > ${gpsConfig.maxSpeedKmh} km/h`,
      };
    }
  }

  return { ok: true };
}

/**
 * Accept a validated point: update member distance and last point.
 * Returns the distance delta in meters.
 */
export function acceptPoint(point: GpsPoint, member: MemberState): number {
  let deltaM = 0;
  if (member.lastPoint) {
    deltaM = distanceM(member.lastPoint, point);
  }
  member.distanceM += deltaM;
  member.lastPoint = point;

  if (!member.trail) member.trail = [];
  member.trail.push([point.lon, point.lat]);

  return deltaM;
}

/**
 * Process a batch of points for a member.
 * Returns the total new distance added (meters) and count of accepted points.
 */
export function processBatch(
  batch: GpsPoint[],
  member: MemberState
): { addedM: number; accepted: number; rejected: number } {
  let addedM = 0;
  let accepted = 0;
  let rejected = 0;

  // Sort by timestamp to ensure order
  const sorted = [...batch].sort((a, b) => a.ts - b.ts);

  for (const point of sorted) {
    const result = validatePoint(point, member);
    if (result.ok) {
      addedM += acceptPoint(point, member);
      accepted++;
    } else {
      rejected++;
    }
  }

  return { addedM, accepted, rejected };
}

/**
 * Compute a concave hull for a set of GPS points (end-of-run area).
 * Returns GeoJSON polygon and area in km².
 */
export function computeArea(
  allPoints: Array<{ lat: number; lon: number }>
): { geoJson: object | null; areaKm2: number } {
  if (allPoints.length < 3) {
    return { geoJson: null, areaKm2: 0 };
  }

  try {
    const features = allPoints.map((p) => turf.point([p.lon, p.lat]));
    const fc = turf.featureCollection(features);

    // Use convex hull (concave hull can be unstable with small point sets)
    const hull = turf.convex(fc);
    if (!hull) {
      return { geoJson: null, areaKm2: 0 };
    }

    const areaM2 = turf.area(hull);
    const areaKm2 = parseFloat((areaM2 / 1_000_000).toFixed(3));

    return { geoJson: hull.geometry, areaKm2 };
  } catch {
    return { geoJson: null, areaKm2: 0 };
  }
}
