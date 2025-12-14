// src/extractors/actors.extractor.js (Deno-compatible)
import axios from "npm:axios@1.6.7";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { v1_base_url } from "../utils/base_v1.js";

export async function extractVoiceActor(id) {
  try {
    const response = await axios.get(`https://${v1_base_url}/people/${id}`);
    const $ = cheerio.load(response.data);

    const name = $(".apw-detail .name").text().trim();
    const japaneseName = $(".apw-detail .sub-name").text().trim();
    const profile = $(".avatar-circle img").attr("src");
    const bioText = $("#bio .bio").text().trim();
    const bioHtml = $("#bio .bio").html();
    const about = { description: bioText, style: bioHtml };

    const roles = [];
    $(".bac-list-wrap .bac-item").each((_, element) => {
      const animeElement = $(element).find(".per-info.anime-info.ltr");
      const characterElement = $(element).find(".per-info.rtl");

      const role = {
        anime: {
          id: animeElement.find(".pi-name a").attr("href")?.split("/").pop(),
          title: animeElement.find(".pi-name a").text().trim(),
          poster:
            animeElement.find(".pi-avatar img").attr("data-src") ||
            animeElement.find(".pi-avatar img").attr("src"),
          type: animeElement.find(".pi-cast").text().trim().split(",")[0].trim(),
          year: animeElement.find(".pi-cast").text().trim().split(",")[1]?.trim(),
        },
        character: {
          id: characterElement.find(".pi-name a").attr("href")?.split("/").pop(),
          name: characterElement.find(".pi-name a").text().trim(),
          profile:
            characterElement.find(".pi-avatar img").attr("data-src") ||
            characterElement.find(".pi-avatar img").attr("src"),
          role: characterElement.find(".pi-cast").text().trim(),
        },
      };
      roles.push(role);
    });

    const voiceActorData = {
      success: true,
      results: {
        data: [
          {
            id,
            name,
            profile,
            japaneseName,
            about,
            roles,
          },
        ],
      },
    };
    return voiceActorData;
  } catch (error) {
    console.error("Error extracting voice actor data:", error);
    throw new Error("Failed to extract voice actor information");
  }
}

export default extractVoiceActor;
