import { extractServers } from "../extractors/streamInfo.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getServers = async (req) => {
  try {
    const { ep } = req.query;

    const cacheKey = `servers_${ep}`;

    // 1) Try cache
    const cachedServers = await getCachedData(cacheKey);
    if (cachedServers) {
      console.log("CACHE HIT → servers", cacheKey);
      return cachedServers;
    }

    // 2) Fetch real data
    const servers = await extractServers(ep);

    // 3) Store cache
    setCachedData(cacheKey, servers).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored servers", cacheKey);

    return servers;

  } catch (e) {
    console.error(e);
    return e;
  }
};
