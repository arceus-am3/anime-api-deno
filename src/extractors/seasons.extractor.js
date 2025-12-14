// src/extractors/seasons.extractor.js
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { safeGet } from "../helper/safeFetch.helper.js";
import { sanitizeId } from "../helper/sanitize.helper.js";
import { v1_base_url } from "../utils/base_v1.js";

async function extractSeasons(rawId) {
  try {
    const id = sanitizeId(rawId);
    if (!id) return []; // safe guard

    // use safeGet (limited redirects + timeout)
    const resp = await safeGet(`https://${v1_base_url}/watch/${id}`);
    const $ = cheerio.load(resp.data || "");

    const seasons = $(".anis-watch>.other-season>.inner>.os-list>a")
      .map((index, element) => {
        const $el = $(element);
        const data_number = index;

        const href = $el.attr("href") || "";
        const data_id = parseInt(href.split("-").pop()) || null;

        const season = $el.find(".title").text().trim() || "";
        const title = ($el.attr("title") || "").trim();

        const cleanId = href.replace(/^\/+/, "");

        const style = $el.find(".season-poster").attr("style") || "";
        const match = style.match(/url\((["']?)(.*?)\1\)/);
        const season_poster = match ? match[2] : "";

        return {
          id: cleanId,
          data_number,
          data_id,
          season,
          title,
          season_poster,
        };
      })
      .get();

    return seasons;
  } catch (e) {
    console.error("extractSeasons error:", e && (e.message || e));
    return []; // safe fallback so controller doesn't 500
  }
}

export default extractSeasons;
