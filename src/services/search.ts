import axios from "axios";
import * as cheerio from "cheerio";

export const DUCKDUCKGO_SEARCH_URL = "https://duckduckgo.com/html/";

export async function webSearch(query: string): Promise<string> {
  try {
    const response = await axios.get(DUCKDUCKGO_SEARCH_URL, {
      params: { q: query },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);
    const results: string[] = [];

    // Extract search result titles and URLs
    $(".result__title a").each((_index, element) => {
      const title = $(element).text().trim();
      const url = $(element).attr("href");

      if (title && url) {
        results.push(`${title} - ${url}`);
      }
    });

    if (results.length === 0) {
      return `No search results found for "${query}".`;
    }

    return results.join("\n");
  } catch (error) {
    console.error("Error performing web search:", error);
    return "Could not retrieve search results. Please try again later.";
  }
}
