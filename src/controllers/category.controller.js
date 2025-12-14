import { extractor } from "../extractors/category.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

export const getCategory = async (req, res, routeType) => {
  if (routeType === "genre/martial-arts") {
    routeType = "genre/marial-arts";
  }

  const requestedPage = parseInt(req.query.page) || 1;

  // unique cache key = category + page number
  const cacheKey = `${routeType.replace(/\//g, "_")}_page_${requestedPage}`;

  try {
    // 1) Try cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse && Object.keys(cachedResponse).length > 0) {
      console.log("CACHE HIT → category", cacheKey);
      return cachedResponse;
    }

    // 2) Fetch fresh result
    const { data, totalPages } = await extractor(routeType, requestedPage);

    if (requestedPage > totalPages) {
      const error = new Error("Requested page exceeds total available pages.");
      error.status = 404;
      throw error;
    }

    const responseData = { totalPages: totalPages, data: data };

    // 3) Save cache
    setCachedData(cacheKey, responseData).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored category", cacheKey);

    return responseData;

  } catch (e) {
    console.error(e);
    return e;
  }
};
