import axios from "axios";
import * as cheerio from "cheerio";

export default {
  async fetch(request) {
    const urlObj = new URL(request.url);
    const pathname = urlObj.pathname;

    // Route match: /api/fb
    if (pathname === "/api/fb") {
      const targetUrl = urlObj.searchParams.get("url");

      if (!targetUrl) {
        return jsonResponse({ error: true, message: "Missing URL parameter" }, 400);
      }

      if (!/facebook\.\w+\/(reel|watch|share)/gi.test(targetUrl)) {
        return jsonResponse({ error: true, message: "Invalid Facebook URL" }, 400);
      }

      try {
        const response = await axios.get("https://fdownloader.net/id", {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });

        const html = response.data;
        const ex = html.match(/k_exp\s*=\s*"(\d+)"/i)?.[1];
        const to = html.match(/k_token\s*=\s*"([a-f0-9]+)"/i)?.[1];

        if (!ex || !to) {
          return jsonResponse({ error: true, message: "Failed to extract tokens" }, 500);
        }

        const searchResponse = await axios.post(
          "https://v3.fdownloader.net/api/ajaxSearch?lang=id",
          new URLSearchParams({
            k_exp: ex,
            k_token: to,
            q: targetUrl,
            lang: "id",
            web: "fdownloader.net",
            v: "v2"
          }),
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              Origin: "https://fdownloader.net"
            }
          }
        );

        const data = searchResponse.data;

        if (data.status !== "ok") {
          return jsonResponse({ error: true, message: "Failed to fetch video data" }, 500);
        }

        const $ = cheerio.load(data.data);
        const title = $(".thumbnail h3").text().trim();
        const duration = $(".thumbnail p").text().trim();
        const thumbnail = $(".thumbnail img").attr("src") || "";
        const videoList = [];

        $("#fbdownloader")
          .find(".tab__content")
          .eq(0)
          .find("tr")
          .each((_, el) => {
            const quality = $(el).find(".video-quality").text().trim();
            const link = $(el).find("a").attr("href");
            if (link && link !== "#note_convert") {
              videoList.push({ quality, link });
            }
          });

        return jsonResponse({
          creator: "Chamod Nimsara",
          metadata: { title, duration, thumbnail },
          download: { videos: videoList }
        });

      } catch (err) {
        return jsonResponse({ error: true, message: err.message }, 500);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

// Utility function
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
