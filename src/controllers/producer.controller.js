import { getCachedData, setCachedData } from "../helper/cache.helper.js";
import extractPage from "../helper/extractPages.helper.js";

export const getProducer = async (req) => {
  const { id } = req.params;
  const routeType = `producer/${id}`;
  const requestedPage = parseInt(req.query.page) || 1;

  const cacheKey = `${routeType.replace(/\//g, "_")}_page_${requestedPage}`;

  try {
    // 1) Check cache
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse && Object.keys(cachedResponse).length > 0) {
      console.log("CACHE HIT → producer", cacheKey);
      return cachedResponse;
    }

    // 2) Fetch fresh
    const [data, totalPages] = await extractPage(requestedPage, routeType);

    if (requestedPage > totalPages) {
      const error = new Error("Requested page exceeds total available pages.");
      error.status = 404;
      throw error;
    }

    const responseData = { data, totalPages };

    // 3) Save cache
    setCachedData(cacheKey, responseData).catch((err) => {
      console.error("Failed to set cache:", err);
    });

    console.log("CACHE MISS → stored producer", cacheKey);

    return responseData;
  } catch (e) {
    console.error(e);
    if (e.status === 404) {
      throw e;
    }
    throw new Error("An error occurred while processing your request.");
  }
};
