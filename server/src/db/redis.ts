import Redis from "ioredis";
import { config } from "../config.js";

const redis = new Redis(config.redisUrl);

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

export default redis;
