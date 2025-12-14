import extractTopTen from "../extractors/topten.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getTopTen = async (req, res) => {
  const cacheKey = "topTen";

  try {
    // 1) Try cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse && Object.keys(cachedResponse).length > 0) {
      console.log("CACHE HIT → topTen");
      return cachedResponse;
    }

    // 2) Fetch fresh
    const topTen = await extractTopTen();

    // 3) Save in cache
    setCachedData(cacheKey, topTen).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored topTen");

    return topTen;
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
