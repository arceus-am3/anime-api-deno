import axios from "npm:axios@1.6.7";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { v1_base_url } from "../utils/base_v1.js";

async function extractTopSearch() {
  try {
    const { data } = await axios.get(`https://${v1_base_url}`);
    const $ = cheerio.load(data);
    const results = [];
    $(".xhashtag a.item").each((_, element) => {
      const title = $(element).text().trim();
      const link = $(element).attr("href");
      results.push({ title, link });
    });
    return results;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

export default extractTopSearch;
