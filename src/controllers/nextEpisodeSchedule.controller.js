import extractNextEpisodeSchedule from "../extractors/getNextEpisodeSchedule.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getNextEpisodeSchedule = async (req) => {
  const { id } = req.params;
  const cacheKey = `nextEpisodeSchedule_${id}`;

  try {
    // 1) 🔍 Check cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse) {
      console.log("CACHE HIT → nextEpisodeSchedule", id);
      return cachedResponse;
    }

    // 2) ⚙️ Fetch fresh data
    const nextEpisodeSchedule = await extractNextEpisodeSchedule(id);
    const responseData = { nextEpisodeSchedule };

    // 3) 💾 Save cache
    setCachedData(cacheKey, responseData).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored nextEpisodeSchedule", id);

    return responseData;
  } catch (e) {
    console.error(e);
    return e;
  }
};
