import extractVoiceActor from "../extractors/voiceactor.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getVoiceActors = async (req, res) => {
  const requestedPage = parseInt(req.query.page) || 1;
  const id = req.params.id;

  // unique cache key based on actor + page
  const cacheKey = `voiceActors_${id}_page_${requestedPage}`;

  try {
    // 1) Try Cache
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → voiceActors", cacheKey);
      return cachedData;
    }

    // 2) Fetch fresh
    const { totalPages, charactersVoiceActors: data } = await extractVoiceActor(
      id,
      requestedPage
    );

    const responseData = {
      currentPage: requestedPage,
      totalPages,
      data,
    };

    // 3) Save into cache
    setCachedData(cacheKey, responseData).catch((err) => {
      console.error("Failed to cache voiceActors:", err);
    });

    console.log("CACHE MISS → stored voiceActors", cacheKey);

    return responseData;

  } catch (e) {
    console.error(e);
    return e;
  }
};
