import extractRandomId from "../extractors/randomId.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getRandomId = async (req, res) => {
  const cacheKey = "randomId";

  try {
    // 1) Try Cache
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → randomId");
      return cachedData;
    }

    // 2) Fresh fetch
    const data = await extractRandomId();

    // 3) Save cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to cache randomId:", err);
    });

    console.log("CACHE MISS → stored randomId");

    return data;
  } catch (error) {
    console.error("Error getting random anime ID:", error.message);
    return error;
  }
};
