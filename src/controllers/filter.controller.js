import extractFilterResults from "../extractors/filter.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const filter = async (req) => {
  try {
    const {
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
      ed,
      keyword,
      page = 1
    } = req.query;

    const pageNum = parseInt(page);

    const params = {};
    if (type) params.type = type;
    if (status) params.status = status;
    if (rated) params.rated = rated;
    if (score) params.score = score;
    if (season) params.season = season;
    if (language) params.language = language;
    if (genres) params.genres = genres;
    if (sort) params.sort = sort;
    if (sy) params.sy = sy;
    if (sm) params.sm = sm;
    if (sd) params.sd = sd;
    if (ey) params.ey = ey;
    if (em) params.em = em;
    if (ed) params.ed = ed;
    if (keyword) params.keyword = keyword;
    if (pageNum > 1) params.page = pageNum;

    // 🔥 Unique cacheKey based on params
    const cacheKey = `filter_${JSON.stringify(params)}`;

    // 1️⃣ Try cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse) {
      console.log("CACHE HIT → filter", cacheKey);
      return cachedResponse;
    }

    // 2️⃣ Fresh fetching
    const [totalPage, data, currentPage, hasNextPage] =
      await extractFilterResults(params);

    if (pageNum > totalPage) {
      const error = new Error("Requested page exceeds total available pages.");
      error.status = 404;
      throw error;
    }

    const response = { data, totalPage, currentPage, hasNextPage };

    // 3️⃣ Save cache safely
    setCachedData(cacheKey, response).catch((err) => {
      console.error("Failed to store cache:", err);
    });

    console.log("CACHE MISS → stored filter", cacheKey);

    return response;
  } catch (e) {
    console.error(e);
    if (e.status === 404) {
      throw e;
    }
    throw new Error("An error occurred while processing your request.");
  }
};
