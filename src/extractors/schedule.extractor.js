import axios from "npm:axios@1.6.7";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { v1_base_url } from "../utils/base_v1.js";

export default async function extractSchedule(date, tzOffset) {
  try {  
    tzOffset = tzOffset ?? -330;

    const resp = await axios.get(
      `https://${v1_base_url}/ajax/schedule/list?tzOffset=${tzOffset}&date=${date}`
    );
    const $ = cheerio.load(resp.data.html);
    const results = [];

    $("li").each((i, element) => {
      const id = $(element)
        ?.find("a")
        .attr("href")
        .split("?")[0]
        .replace("/", "");
      const data_id = id?.split("-").pop();
      const title = $(element).find(".film-name").text().trim();
      const japanese_title = $(element)
        .find(".film-name")
        .attr("data-jname")
        ?.trim();
      const releaseDate = date;
      const time = $(element).find(".time").text().trim();
      const episode_no = $(element)
        ?.find(".btn-play")
        .text()
        .trim()
        .split(" ")
        .pop();
      results.push({
        id,
        data_id,
        title,
        japanese_title,
        releaseDate,
        time,
        episode_no,
      });
    });

    return results;
  } catch (error) {
    console.log(error.message);
    return [];
  }
}
