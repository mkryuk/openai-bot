import { OpenAi } from "../openai";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

jest.mock("../../services/search");

describe("OpenAi webSearch", () => {
  let openAi: OpenAi;
  let mock: MockAdapter;

  beforeAll(() => {
    openAi = new OpenAi("test-token");
    mock = new MockAdapter(axios);
  });

  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
  });

  it("should handle webSearch tool call", async () => {
    const query = "latest AI trends";
    const mockResponse = "AI Trends 2025 - https://example.com/ai-trends";
    const { webSearch } = require("../../services/search");
    webSearch.mockResolvedValue(mockResponse);

    const message = "Search for latest AI trends";
    const toolCallResponse = {
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "web_search_call",
                  function: {
                    name: "webSearch",
                    arguments: `{"query":"${query}"}`,
                  },
                },
              ],
            },
          },
        ],
      },
    };

    postToOpenAiSpy.mockResolvedValueOnce(toolCallResponse);
    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "Here are the search results for latest AI trends",
            },
          },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(webSearch).toHaveBeenCalledWith(query);
    expect(result).toBe("Here are the search results for latest AI trends");
  });

  afterEach(() => {
    mock.reset();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mock.restore();
  });
});
