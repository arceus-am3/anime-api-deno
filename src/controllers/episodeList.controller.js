import extractEpisodesList from "../extractors/episodeList.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getEpisodes = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `episodes_${id}`;

  try {
    // 1) Check cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse && Object.keys(cachedResponse).length > 0) {
      console.log("CACHE HIT → episodes", id);
      return cachedResponse;
    }

    // 2) Real data fetch
    const data = await extractEpisodesList(encodeURIComponent(id));

    // 3) Save cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → episodes stored", id);
    return data;

  } catch (e) {
    console.error("Error fetching episodes:", e);
    return e;
  }
};
