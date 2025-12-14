import axios from "npm:axios@1.6.7";

export async function safeGet(url) {
  try {
    const resp = await axios.get(url, {
      maxRedirects: 6,
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: null,
    });

    // If server responded with a 3xx that we didn't follow fully, make a controlled error
    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers?.location || "(no-location)";
      const e = new Error(`Remote redirected: ${resp.status} -> ${loc}`);
      e.status = 422;
      throw e;
    }

    return resp;
  } catch (err) {
    if (err?.code === "ERR_FR_TOO_MANY_REDIRECTS" || (err?.message && err.message.includes("Maximum number of redirects"))) {
      const e = new Error("Redirect loop or blocked by remote site");
      e.status = 422;
      throw e;
    }
    if (err?.code === "ECONNABORTED") {
      const e = new Error("Request timeout");
      e.status = 504;
      throw e;
    }
    throw err;
  }
}
