import extractSearchResults from "../extractors/search.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const search = async (req) => {
  try {
    let {
      keyword,
      type,
      status,
      rated,
      score,
      season,
      language,
      genres,
      sort,
      sy,
      sm,
      sd,
      ey,
      em,
      ed
    } = req.query;

    let page = parseInt(req.query.page) || 1;

    // make dynamic cache key based on all filters
    const cacheKey = `search_${keyword || ""}_${type || ""}_${status || ""}_${rated || ""}_${score || ""}_${season || ""}_${language || ""}_${genres || ""}_${sort || ""}_${sy || ""}_${sm || ""}_${sd || ""}_${ey || ""}_${em || ""}_${ed || ""}_${page}`;

    // 1) Try cache
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → search:", cacheKey);
      return cachedData;
    }

    // 2) Call original extractor
    const [totalPage, data] = await extractSearchResults({
      keyword,
      type,
      status,
      rated,
      score,
      season,
      language,
      genres,
      sort,
      page,
      sy,
      sm,
      sd,
      ey,
      em,
      ed
    });

    if (page > totalPage) {
      const error = new Error("Requested page exceeds total available pages.");
      error.status = 404;
      throw error;
    }

    const response = { data, totalPage };

    // 3) Save cache
    setCachedData(cacheKey, response).catch(err => {
      console.error("Failed to store cache:", err);
    });

    console.log("CACHE MISS → stored search", cacheKey);

    return response;

  } catch (e) {
    console.error(e);
    if (e.status === 404) {
      throw e;
    }
    throw new Error("An error occurred while processing your request.");
  }
};
