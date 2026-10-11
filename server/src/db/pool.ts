import Pool from "pg";
import { config } from "../config.js";

const pool = new Pool.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export default pool;

/**
 * Run the schema migration. Creates tables if they don't exist.
 */
export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        device_id     TEXT UNIQUE NOT NULL,
        display_name  TEXT NOT NULL DEFAULT 'Runner',
        lifetime_km   NUMERIC(10,3) DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id            TEXT PRIMARY KEY,
        code          CHAR(6) NOT NULL,
        host_id       TEXT REFERENCES users(id),
        status        TEXT CHECK (status IN ('lobby','live','ended','expired')) DEFAULT 'lobby',
        target_km     NUMERIC(6,1) DEFAULT 50.0,
        group_size    INT DEFAULT 0,
        scale_factor  NUMERIC(3,2) DEFAULT 1.0,
        created_at    TIMESTAMPTZ DEFAULT now(),
        started_at    TIMESTAMPTZ,
        ended_at      TIMESTAMPTZ
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_active_code
        ON rooms(code) WHERE status IN ('lobby','live');

      CREATE TABLE IF NOT EXISTS members (
        room_id       TEXT REFERENCES rooms(id),
        user_id       TEXT REFERENCES users(id),
        display_name  TEXT NOT NULL,
        distance_m    NUMERIC(10,2) DEFAULT 0,
        joined_at     TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (room_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS points (
        id            BIGSERIAL PRIMARY KEY,
        room_id       TEXT NOT NULL,
        user_id       TEXT NOT NULL,
        ts            TIMESTAMPTZ NOT NULL,
        lat           DOUBLE PRECISION NOT NULL,
        lon           DOUBLE PRECISION NOT NULL,
        accuracy      REAL
      );

      CREATE INDEX IF NOT EXISTS idx_points_room_user
        ON points(room_id, user_id, ts);

      CREATE TABLE IF NOT EXISTS tier_unlocks (
        room_id       TEXT REFERENCES rooms(id),
        tier_name     TEXT NOT NULL,
        threshold_km  NUMERIC(6,1),
        total_km      NUMERIC(10,3),
        triggered_by  TEXT REFERENCES users(id),
        unlocked_at   TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (room_id, tier_name)
      );

      CREATE TABLE IF NOT EXISTS results (
        room_id       TEXT PRIMARY KEY REFERENCES rooms(id),
        total_km      NUMERIC(10,3),
        final_tier    TEXT,
        duration_s    INT,
        area_km2      NUMERIC(10,3),
        hull_geojson  JSONB,
        story_text    TEXT,
        badges        JSONB,
        created_at    TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log("✅ Database migration complete");
  } finally {
    client.release();
  }
}
