import extractRandom from "../extractors/random.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getRandom = async (req, res) => {
  const cacheKey = "random"; // same result for next calls within few minutes

  try {
    // 1) 🔍 Try to get from cache
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → random");
      return cachedData;
    }

    // 2) 🧠 Real fetch
    const data = await extractRandom();

    // 3) 💾 Store cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored random");

    return data;
  } catch (error) {
    console.error("Error getting random anime:", error.message);
    return error;
  }
};
