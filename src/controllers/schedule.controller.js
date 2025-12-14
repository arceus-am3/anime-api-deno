import extractSchedule from "../extractors/schedule.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getSchedule = async (req) => {
  const date = req.query.date;
  const tzOffset = req.query.tzOffset || -330;

  // unique cache key
  const cacheKey = `schedule_${date}_${tzOffset}`;

  try {
    // 1) Try cache
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("CACHE HIT → schedule", cacheKey);
      return cached;
    }

    // 2) Real fetch
    const data = await extractSchedule(date, tzOffset);

    // 3) Save cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored schedule", cacheKey);

    return data;
  } catch (e) {
    console.error(e);
    return e;
  }
};
