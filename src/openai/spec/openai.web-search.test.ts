import { OpenAi } from "../openai";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { DUCKDUCKGO_SEARCH_URL } from "../../services/search";

describe("OpenAi webSearch", () => {
  let openAi: OpenAi;
  let mock: MockAdapter;

  beforeAll(() => {
    openAi = new OpenAi("test-token");
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it("should return search results for a valid query", async () => {
    const query = "latest AI trends";
    const mockResponse = `
      <div class="result__title">
        <a href="https://example.com/ai-trends">AI Trends 2025</a>
      </div>
    `;

    mock.onGet(DUCKDUCKGO_SEARCH_URL).reply(200, mockResponse);

    const result = await openAi.webSearch(query);
    expect(result).toContain("AI Trends 2025 - https://example.com/ai-trends");
  });

  it("should return a message when no results are found", async () => {
    const query = "nonexistent query";
    const mockResponse = `<div class="no-results">No results found</div>`;

    mock.onGet(DUCKDUCKGO_SEARCH_URL).reply(200, mockResponse);

    const result = await openAi.webSearch(query);
    expect(result).toBe(`No search results found for "${query}".`);
  });

  it("should handle errors gracefully", async () => {
    const query = "error query";

    mock.onGet(DUCKDUCKGO_SEARCH_URL).networkError();

    const result = await openAi.webSearch(query);
    expect(result).toBe(
      "Could not retrieve search results. Please try again later.",
    );
  });
});
