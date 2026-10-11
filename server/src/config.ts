import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://relay:relay@localhost:5432/touchgrass",

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // Room
  roomCodeLength: parseInt(process.env.ROOM_CODE_LENGTH || "6", 10),
  roomMaxMembers: parseInt(process.env.ROOM_MAX_MEMBERS || "20", 10),
  roomLobbyTtlMinutes: parseInt(
    process.env.ROOM_LOBBY_TTL_MINUTES || "30",
    10
  ),

  // GPS filters
  gps: {
    maxAccuracyM: parseFloat(process.env.GPS_MAX_ACCURACY_M || "25"),
    maxSpeedKmh: parseFloat(process.env.GPS_MAX_SPEED_KMH || "25"),
    minMovementM: parseFloat(process.env.GPS_MIN_MOVEMENT_M || "3"),
    maxJumpM: parseFloat(process.env.GPS_MAX_JUMP_M || "500"),
    minIntervalS: parseFloat(process.env.GPS_MIN_INTERVAL_S || "3"),
  },

  // Tier
  tierBaseTargetKm: parseFloat(process.env.TIER_BASE_TARGET_KM || "50"),
} as const;
