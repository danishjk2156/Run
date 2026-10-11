/**
 * Fake GPS Simulator
 * ==================
 * Simulates N runners sending GPS batches to the server via WebSocket.
 * Each runner walks a random path radiating out from a starting point.
 *
 * Usage:
 *   npm run fake-gps
 *
 * The script:
 *  1. Creates a room via REST
 *  2. Joins N runners
 *  3. Starts the run
 *  4. Each runner sends GPS batches every 5 seconds
 *  5. After reaching the target distance, stops the run
 */

import { io as SocketClient } from "socket.io-client";

const API = "http://localhost:3001/api";
const WS = "http://localhost:3001";

const NUM_RUNNERS = 4;
const TARGET_KM = 50;
const BATCH_INTERVAL_MS = 2000; // Send a batch every 2s (simulated time moves faster)
const POINTS_PER_BATCH = 5;
const STEP_M = 50; // Each simulated point is ~50m from the last
const SPEED_FACTOR = 10; // Time compression: 1 real second = 10 simulated seconds

// ─── Starting point: Connaught Place, New Delhi ───────────────────────
const START_LAT = 28.6315;
const START_LON = 77.2167;

interface Runner {
  userId: string;
  name: string;
  lat: number;
  lon: number;
  bearing: number; // degrees, direction of movement
  simTs: number; // simulated unix timestamp
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: object
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}

function movePoint(
  lat: number,
  lon: number,
  bearingDeg: number,
  distanceM: number
): { lat: number; lon: number } {
  const R = 6_371_000;
  const d = distanceM / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lon: (lon2 * 180) / Math.PI,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🏃 Touch Grass Relay — Fake GPS Simulator");
  console.log(`   Runners: ${NUM_RUNNERS}`);
  console.log(`   Target: ${TARGET_KM} km\n`);

  // 1. Create room
  const { roomId, code, userId: hostId } = await api("POST", "/rooms", {
    displayName: "Runner_1",
    targetKm: TARGET_KM,
  });
  console.log(`🏠 Room created: ${code} (id=${roomId})`);

  // 2. Join runners
  const runners: Runner[] = [
    {
      userId: hostId,
      name: "Runner_1",
      lat: START_LAT,
      lon: START_LON,
      bearing: 0,
      simTs: Math.floor(Date.now() / 1000),
    },
  ];

  for (let i = 2; i <= NUM_RUNNERS; i++) {
    const { userId } = await api("POST", "/rooms/join", {
      code,
      displayName: `Runner_${i}`,
    });
    runners.push({
      userId,
      name: `Runner_${i}`,
      lat: START_LAT,
      lon: START_LON,
      bearing: (360 / NUM_RUNNERS) * (i - 1), // Spread runners in different directions
      simTs: Math.floor(Date.now() / 1000),
    });
    console.log(`👤 Runner_${i} joined`);
  }

  // 3. Start the run
  await api("POST", `/rooms/${roomId}/start`, { userId: hostId });
  console.log(`\n🏃 RUN STARTED!\n`);

  // 4. Connect WebSocket for each runner
  const sockets = runners.map((runner) => {
    const socket = SocketClient(WS, {
      query: {
        roomId,
        userId: runner.userId,
        displayName: runner.name,
      },
    });

    socket.on("tier_unlocked", (data: any) => {
      console.log(`\n🏆 ═══════════════════════════════════════════`);
      console.log(`   ${data.tier.toUpperCase()} UNLOCKED!`);
      console.log(`   ${data.voiceLine}`);
      console.log(`   Total: ${data.totalKm} km | Triggered by: ${data.triggeredBy}`);
      console.log(`   ═══════════════════════════════════════════\n`);
    });

    socket.on("state", (data: any) => {
      // Only log from runner 1 to reduce noise
      if (runner.name === "Runner_1") {
        const memberList = data.members
          .map((m: any) => `${m.name}: ${m.km} km`)
          .join(" | ");
        process.stdout.write(
          `\r📊 Total: ${data.totalKm} km [${data.currentTier}] | ${memberList}    `
        );
      }
    });

    socket.on("run_ended", (data: any) => {
      console.log(`\n\n🛑 ═══════════════════════════════════════════`);
      console.log(`   RUN ENDED`);
      console.log(`   Total: ${data.totalKm} km | Tier: ${data.finalTier}`);
      console.log(`   Duration: ${Math.round(data.durationS / 60)} min`);
      console.log(`   Area: ${data.areaKm2} km²`);
      console.log(`\n   📖 "${data.story}"`);
      console.log(`\n   Members:`);
      for (const m of data.members) {
        console.log(
          `     ${m.name}: ${m.km} km [${m.badges.join(", ") || "no badges"}]`
        );
      }
      console.log(`   ═══════════════════════════════════════════\n`);
      process.exit(0);
    });

    socket.on("error", (data: any) => {
      console.error(`❌ ${runner.name} error:`, data.message);
    });

    return { socket, runner };
  });

  // Wait for connections
  await sleep(1000);

  // 5. Simulate GPS batches
  let totalSimulatedKm = 0;
  let batchCount = 0;

  while (totalSimulatedKm < TARGET_KM * 1.1) {
    // Go 10% over to be sure
    for (const { socket, runner } of sockets) {
      const batch: Array<{ lat: number; lon: number; ts: number; acc: number }> = [];

      for (let p = 0; p < POINTS_PER_BATCH; p++) {
        // Add slight randomness to bearing (±15°)
        const jitter = (Math.random() - 0.5) * 30;
        const bearing = (runner.bearing + jitter + 360) % 360;

        // Move the runner forward
        const next = movePoint(runner.lat, runner.lon, bearing, STEP_M);
        runner.lat = next.lat;
        runner.lon = next.lon;
        runner.simTs += 5 * SPEED_FACTOR; // 5 simulated seconds per point × speed factor

        batch.push({
          lat: runner.lat,
          lon: runner.lon,
          ts: runner.simTs,
          acc: 5 + Math.random() * 10, // 5-15m accuracy
        });
      }

      socket.emit("points", { batch });
      totalSimulatedKm += (STEP_M * POINTS_PER_BATCH * NUM_RUNNERS) / 1_000_000;
    }

    // Approximate total (rough, since server does real calc)
    totalSimulatedKm =
      STEP_M * POINTS_PER_BATCH * NUM_RUNNERS * (batchCount + 1) / 1000;
    batchCount++;

    await sleep(BATCH_INTERVAL_MS);

    // Stop after reaching target
    if (totalSimulatedKm >= TARGET_KM) {
      console.log(`\n\n⏹️  Target reached. Stopping run...`);
      await sleep(2000); // Let final batches process
      await api("POST", `/rooms/${roomId}/stop-and-broadcast`, {
        userId: hostId,
      });
      await sleep(3000); // Wait for run_ended event
      break;
    }
  }

  // Cleanup
  for (const { socket } of sockets) {
    socket.disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
