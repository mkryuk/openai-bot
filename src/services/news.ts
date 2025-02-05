import axios from "axios";

const NEWS_API_URL = "https://gnews.io/api/v4/search";
const NEWS_API_KEY = process.env.GNEWS_API_KEY;

export async function fetchNews(
  topic: string,
  max: number = 1,
  language: string = "",
  country: string = "",
  fromDate: string = "",
  toDate: string = "",
): Promise<string> {
  try {
    const params: Record<string, string> = {
      q: topic,
      max: max.toString(),
      apikey: NEWS_API_KEY || "",
    };

    if (language) {
      params["lang"] = language;
    }
    if (country) {
      params["country"] = country;
    }
    if (fromDate) {
      params["from"] = fromDate;
    }
    if (toDate) {
      params["to"] = toDate;
    }

    const response = await axios.get(NEWS_API_URL, { params });

    if (!response.data.articles || response.data.articles.length === 0) {
      return `No news found about "${topic}" within the specified date range.`;
    }

    const result = response.data.articles.map((article: any) => {
      return `Title: ${article.title}\nDescription: ${article.description}\nURL: ${article.url}`;
    });

    return result.join("\n\n");
  } catch (error) {
    console.error("Error fetching news:", error);
    return "Could not retrieve news. Please try again later.";
  }
}
