import extractAnimeInfo from "../extractors/animeInfo.extractor.js";
import extractSeasons from "../extractors/seasons.extractor.js";
import extractEpisodesList from "../extractors/episodeList.extractor.js"; // optional
import { getCachedData, setCachedData } from "../helper/cache.helper.js";
import { sanitizeId } from "../helper/sanitize.helper.js";

export const getAnimeInfo = async (req, res) => {
  const rawId = req.query.id || req.params.id || "";
  const id = sanitizeId(rawId);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const cacheKey = `animeInfo_${id}`;

  try {
    // try cached response first
    const cached = await getCachedData(cacheKey);
    if (cached && Object.keys(cached).length) {
      console.log("CACHE HIT → animeInfo", id);
      return res.json(cached);
    }

    // attempt to fetch both but handle failures individually
    const [seasonsRes, infoRes] = await Promise.allSettled([
      extractSeasons(id),
      extractAnimeInfo(id),
    ]);

    let seasons = [];
    let data = null;
    let episodes = null;
    let partialError = null;

    if (seasonsRes.status === "fulfilled") {
      seasons = seasonsRes.value || [];
    } else {
      console.warn("extractSeasons failed for", id, seasonsRes.reason?.message || seasonsRes.reason);
    }

    if (infoRes.status === "fulfilled") {
      data = infoRes.value;
    } else {
      // info failed (likely blocked/redirect) -> mark partialError and try episode fallback
      const err = infoRes.reason || {};
      partialError = err.message || "Failed to fetch anime info";

      console.warn("extractAnimeInfo failed:", partialError, err.status || "");

      // episodes fallback (optional)
      try {
        episodes = await extractEpisodesList(encodeURIComponent(id));
      } catch (e2) {
        console.warn("episodes fallback failed:", e2 && e2.message);
      }

      // **Cache a blocked marker** to avoid re-fetching this slug repeatedly
      const BLOCK_TTL = 60 * 60; // 1 hour
      const blockedCache = {
        data: null,
        seasons,
        episodes: episodes || null,
        partialError,
        blocked: true,
        blockedAt: Date.now(),
      };

      try {
        // pass TTL so blocked marker stays for BLOCK_TTL seconds
        await setCachedData(cacheKey, blockedCache, BLOCK_TTL);
        console.log("Marked slug as blocked in cache:", id);
      } catch (cacheErr) {
        console.error("Failed to cache blocked marker:", cacheErr);
      }

      // return partial response (200) so frontend shows available data
      return res.json(blockedCache);
    }

    // If full info obtained, combine and cache
    const responseData = { data, seasons, episodes, partialError: null };

    try {
      await setCachedData(cacheKey, responseData);
    } catch (cacheErr) {
      console.error("Failed to set cache:", cacheErr);
    }

    return res.json(responseData);
  } catch (e) {
    console.error("getAnimeInfo controller error:", e);
    const status = e?.status || 500;
    return res.status(status).json({ error: e.message || "An error occurred" });
  }
};
