import getSuggestion from "../extractors/suggestion.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getSuggestions = async (req) => {
  const { keyword } = req.query;

  // keyword null ya empty na ho
  const encodedKeyword = encodeURIComponent(keyword);
  const cacheKey = `suggestions_${encodedKeyword}`;

  try {
    // 1) Try cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse) {
      console.log("CACHE HIT → suggestions:", encodedKeyword);
      return cachedResponse;
    }

    // 2) Real fetch
    const data = await getSuggestion(encodedKeyword);

    // 3) Save cache safely
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored suggestions:", encodedKeyword);

    return data;
  } catch (e) {
    console.error(e);
    return e;
  }
};
