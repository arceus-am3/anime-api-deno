import extractQtip from "../extractors/qtip.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getQtip = async (req) => {
  try {
    const { id } = req.params;

    const cacheKey = `qtip_${id}`;

    // 1) Try cache
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("CACHE HIT → qtip", cacheKey);
      return cached;
    }

    // 2) Fetch fresh
    const data = await extractQtip(id);

    // 3) Save cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored qtip", cacheKey);

    return data;

  } catch (e) {
    console.error(e);
    return e;
  }
};
