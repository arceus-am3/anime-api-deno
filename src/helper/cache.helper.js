// src/helper/cache.helper.js  (FINAL version - Deno + Upstash Redis)

import { Redis } from "npm:@upstash/redis@1.31.4";

// Upstash envs
const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL") || null;
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN") || null;

let redis = null;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });
    console.log("Upstash Redis client initialised");
  } catch (err) {
    console.error("Failed to init Upstash Redis client:", err);
    redis = null;
  }
} else {
  console.log("Upstash env missing, cache disabled");
}

// ------------------- GET CACHE -------------------
export const getCachedData = async (key) => {
  try {
    if (!redis) return null;
    if (!key) return null;

    const val = await redis.get(key); // can be string, object, null

    if (val === null || val === undefined) return null;

    // Hum JSON string store kar rahe hain:
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        // Agar parse fail ho to raw return kar do
        return val;
      }
    }

    return val;
  } catch (err) {
    console.error("Cache read error:", err);
    return null; // cache fail -> normal fetch chalega
  }
};

// ------------------- SET CACHE -------------------
export const setCachedData = async (key, value, ttlSeconds = 300) => {
  try {
    if (!redis) return;
    // Guard: skip null/undefined values (prevents Upstash null-arg errors)
    if (value === null || value === undefined) return;
    if (!key) return;

    // Ensure we store string (JSON)
    const json = typeof value === "string" ? value : JSON.stringify(value);

    // Upstash client supports set with options (ex: expire seconds)
    await redis.set(key, json, { ex: ttlSeconds });
  } catch (err) {
    console.error("Cache write error:", err);
    // ignore: API normal chalega, sirf cache skip hoga
  }
};
