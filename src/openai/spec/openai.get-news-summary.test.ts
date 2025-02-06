import { OpenAi } from "../openai";
import { fetchNews } from "../../services/news";

jest.mock("../../services/news");

describe("OpenAi getNewsSummary Tool", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
  });

  it("should handle getNewsSummary tool call", async () => {
    const message = "What's the latest news about AI?";
    const mockNewsSummary =
      "Title: AI News\nDescription: Latest AI news\nURL: http://example.com";
    (fetchNews as jest.Mock).mockResolvedValue(mockNewsSummary);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "news_call",
                  function: {
                    name: "getNewsSummary",
                    arguments:
                      '{"topic":"AI","max":1,"language":"en","country":"us","fromDate":"","toDate":""}',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "Here is the latest news about AI",
            },
          },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(fetchNews).toHaveBeenCalledWith("AI", 1, "en", "us", "", "");
    expect(result).toBe("Here is the latest news about AI");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
