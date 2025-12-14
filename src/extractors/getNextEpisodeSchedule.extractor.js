import axios from "npm:axios@1.6.7";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { v1_base_url } from "../utils/base_v1.js";

export default async function extractNextEpisodeSchedule(id) {
  try {
    const { data } = await axios.get(`https://${v1_base_url}/watch/${id}`);
    const $ = cheerio.load(data);
    const nextEpisodeSchedule = $(
      ".schedule-alert > .alert.small > span:last"
    ).attr("data-value");
    return nextEpisodeSchedule;
  } catch (error) {
    console.error(error);
  }
}
