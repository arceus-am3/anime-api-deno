// src/extractors/animeInfo.extractor.js  (Deno-compatible, patched)
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import formatTitle from "../helper/formatTitle.helper.js";
import { v1_base_url } from "../utils/base_v1.js";
import extractRecommendedData from "./recommend.extractor.js";
import extractRelatedData from "./related.extractor.js";
import extractPopularData from "./popular.extractor.js";
import { safeGet } from "../helper/safeFetch.helper.js";
import { sanitizeId } from "../helper/sanitize.helper.js";

/**
 * extractAnimeInfo
 * - id: raw slug (controller should sanitize but we sanitize again)
 * - returns structured info or throws an Error with `.status` for controller to handle
 */
async function extractAnimeInfo(rawId) {
  const id = sanitizeId(rawId);
  if (!id) {
    const err = new Error("Invalid id");
    err.status = 400;
    throw err;
  }

  const data_id = id.split("-").pop();

  const url = `https://${v1_base_url}/${id}`;
  const charUrl = `https://${v1_base_url}/ajax/character/list/${data_id}`;

  console.log("extractAnimeInfo -> id:", JSON.stringify(id), "url:", url);

  try {
    // fetch main page + character ajax (character optional)
    const [pageResp, charResp] = await Promise.allSettled([
      safeGet(url),
      safeGet(charUrl),
    ]);

    if (pageResp.status !== "fulfilled") {
      // page fetch failed (could be redirect loop / blocked)
      const e = pageResp.reason || new Error("Failed to fetch page");
      const err = new Error(e.message || "Failed to fetch anime page");
      err.status = e.status || 422;
      throw err;
    }

    const resp = pageResp.value;
    if (!resp || resp.status >= 400) {
      const err = new Error(`Remote returned status ${resp?.status || "unknown"}`);
      err.status = resp?.status || 422;
      throw err;
    }

    // character HTML might be optional; handle gracefully
    const characterHtml =
      charResp.status === "fulfilled" && charResp.value && charResp.value.data
        ? (charResp.value.data?.html || "")
        : "";

    const $1 = cheerio.load(characterHtml || "");
    const $ = cheerio.load(resp.data || "");

    const titleElement = $("#ani_detail .film-name");
    const title = (titleElement.text() || "").trim();
    const japanese_title = titleElement.attr("data-jname") || "";

    const posterElement = $("#ani_detail .film-poster");
    const poster =
      posterElement.find("img").attr("src") ||
      posterElement.find("img").attr("data-src") ||
      "";

    // tvInfo
    const tvInfoElement = $("#ani_detail .film-stats");
    const tvInfo = {};
    tvInfoElement.find(".tick-item, span.item").each((_, element) => {
      const el = $(element);
      const text = (el.text() || "").trim();
      if (el.hasClass("tick-quality")) tvInfo.quality = text;
      else if (el.hasClass("tick-sub")) tvInfo.sub = text;
      else if (el.hasClass("tick-dub")) tvInfo.dub = text;
      else if (el.hasClass("tick-eps")) tvInfo.eps = text;
      else if (el.hasClass("tick-pg")) tvInfo.rating = text;
      else if (el.is("span.item")) {
        if (!tvInfo.showType) tvInfo.showType = text;
        else if (!tvInfo.duration) tvInfo.duration = text;
      }
    });

    // sync data (anilist / mal)
    const syncDataScript = $("#syncData").html() || "";
    let anilistId = null;
    let malId = null;
    if (syncDataScript) {
      try {
        const syncData = JSON.parse(syncDataScript);
        anilistId = syncData.anilist_id || null;
        malId = syncData.mal_id || null;
      } catch (err) {
        console.error("Error parsing syncData:", err);
      }
    }

    // animeInfo key-values
    const element = $("#ani_detail > .ani_detail-stage .anisc-info-wrap .anisc-info > .item");
    const animeInfo = {};
    element.each((_, el) => {
      const $el = $(el);
      const key = ($el.find(".item-head").text() || "").trim().replace(":", "");
      let value;
      if (key === "Genres" || key === "Producers") {
        value = $el.find("a").map((_, a) => ($($(a)).text() || "").split(" ").join("-").trim()).get();
      } else {
        value = ($el.find(".name").text() || "").split(" ").join("-").trim();
      }
      animeInfo[key] = value;
    });

    // overview
    const overviewElement = $("#ani_detail .film-description .text");
    animeInfo["Overview"] = (overviewElement.text() || "").trim();
    animeInfo["tvInfo"] = tvInfo;

    // trailers (safe)
    const trailers = [];
    $('.block_area-promotions-list .screen-items .item').each((_, el) => {
      const $el = $(el);
      const tTitle = $el.attr("data-title") || null;
      const urlRaw = $el.attr("data-src") || null;
      if (urlRaw) {
        const fullUrl = urlRaw.startsWith("//") ? `https:${urlRaw}` : urlRaw;
        let videoId = null;
        const match = fullUrl.match(/\/embed\/([^?&]+)/);
        if (match && match[1]) videoId = match[1];
        trailers.push({
          title: tTitle,
          url: fullUrl,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
        });
      }
    });
    animeInfo.trailers = trailers;

    // recommended / related / popular (these functions use $)
    const [recommended_data, related_data, popular_data] = await Promise.all([
      extractRecommendedData($),
      extractRelatedData($),
      extractPopularData($),
    ]);

    // characters + voice actors (safe)
    let charactersVoiceActors = [];
    if (characterHtml) {
      charactersVoiceActors = $1(".bac-list-wrap .bac-item")
        .map((index, el) => {
          const $el = $1(el);
          const character = {
            id: $el.find(".per-info.ltr .pi-avatar").attr("href")?.split("/")[2] || "",
            poster: $el.find(".per-info.ltr .pi-avatar img").attr("data-src") || "",
            name: $el.find(".per-info.ltr .pi-detail a").text() || "",
            cast: $el.find(".per-info.ltr .pi-detail .pi-cast").text() || "",
          };

          let voiceActors = [];
          const rtlVoiceActors = $el.find(".per-info.rtl");
          const xxVoiceActors = $el.find(".per-info.per-info-xx .pix-list .pi-avatar");
          if (rtlVoiceActors.length > 0) {
            voiceActors = rtlVoiceActors
              .map((_, actorEl) => ({
                id: $1(actorEl).find("a").attr("href")?.split("/").pop() || "",
                poster: $1(actorEl).find("img").attr("data-src") || "",
                name: ($1(actorEl).find(".pi-detail .pi-name a").text() || "").trim(),
              }))
              .get();
          } else if (xxVoiceActors.length > 0) {
            voiceActors = xxVoiceActors
              .map((_, actorEl) => ({
                id: $1(actorEl).attr("href")?.split("/").pop() || "",
                poster: $1(actorEl).find("img").attr("data-src") || "",
                name: $1(actorEl).attr("title") || "",
              }))
              .get();
          }

          return { character, voiceActors };
        })
        .get();
    }

    const season_id = formatTitle(title || "", data_id);

    return {
      adultContent: !!($(".tick-rate", posterElement).text() || "").trim().includes("18+"),
      data_id,
      id: season_id,
      anilistId,
      malId,
      title,
      japanese_title,
      poster,
      showType: $("#ani_detail .prebreadcrumb ol li").eq(1).find("a").text().trim() || "",
      animeInfo,
      charactersVoiceActors,
      recommended_data,
      related_data,
      popular_data,
    };
  } catch (e) {
    console.error("Error extracting anime info:", e && (e.status || e.message || e));
    // rethrow with status if exists so controller can return proper status
    const err = e instanceof Error ? e : new Error("Unknown error");
    if (e && e.status) err.status = e.status;
    throw err;
  }
}

export default extractAnimeInfo;
