import { extractStreamingInfo } from "../extractors/streamInfo.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getStreamInfo = async (req, res, fallback = false) => {
  try {
    const input = req.query.id;
    const server = req.query.server;
    const type = req.query.type;

    const match = input.match(/ep=(\d+)/);
    if (!match) throw new Error("Invalid URL format");

    const finalId = match[1];

    // caching key = episode + server + type
    const cacheKey = `stream_${finalId}_${server || "default"}_${type || "any"}`;

    // 1) Try cache
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("CACHE HIT → streamInfo", cacheKey);
      return cached;
    }

    // 2) Fetch fresh
    const streamingInfo = await extractStreamingInfo(finalId, server, type, fallback);

    // 3) Save cache
    setCachedData(cacheKey, streamingInfo).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored streamInfo", cacheKey);

    return streamingInfo;

  } catch (e) {
    console.error(e);
    return { error: e.message };
  }
};
