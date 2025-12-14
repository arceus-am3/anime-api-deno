import extractTopSearch from "../extractors/topsearch.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

const getTopSearch = async () => {
  const cacheKey = "topSearch";

  try {
    // 1) Check cache
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("CACHE HIT → topSearch");
      return cached;
    }

    // 2) Fetch real data
    const data = await extractTopSearch();

    // 3) Save cache
    setCachedData(cacheKey, data).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored topSearch");

    return data;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export default getTopSearch;
