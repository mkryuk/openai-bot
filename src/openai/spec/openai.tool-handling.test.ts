import { OpenAi } from "../openai";
import { getWeather, getWeatherForecast, getHistoricalWeather } from "../../services/weather";
import { getCryptoExchangeRate, getFiatExchangeRate } from "../../services/currency";
import { fetchNews } from "../../services/news";

jest.mock("../../services/weather");
jest.mock("../../services/currency");
jest.mock("../../services/news");

describe("OpenAi Tool Handling", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
  });

  it("should handle getNewsSummary tool call", async () => {
    const message = "What's the latest news about AI?";
    const mockNewsSummary = "Title: AI News\nDescription: Latest AI news\nURL: http://example.com";
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
                    arguments: '{"topic":"AI","language":"en","country":"us","fromDate":"","toDate":""}',
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
    expect(fetchNews).toHaveBeenCalledWith("AI", "en", "us", "", "");
    expect(result).toBe("Here is the latest news about AI");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle multiple tool calls in sequence", async () => {
    const message = "What's the weather in Paris and London?";
    (getWeather as jest.Mock)
      .mockResolvedValueOnce("Paris: Sunny, 20°C")
      .mockResolvedValueOnce("London: Rainy, 15°C");

    // First API call returns tool calls
    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call1",
                  function: {
                    name: "getWeather",
                    arguments: '{"location":"Paris"}',
                  },
                },
                {
                  id: "call2",
                  function: {
                    name: "getWeather",
                    arguments: '{"location":"London"}',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    // Second API call returns final response
    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content:
                "Here's the weather: Paris is sunny at 20°C and London is rainy at 15°C",
            },
          },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);

    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenCalledWith("Paris");
    expect(getWeather).toHaveBeenCalledWith("London");
    expect(result).toBe(
      "Here's the weather: Paris is sunny at 20°C and London is rainy at 15°C",
    );
  });

  it("should handle unknown tool calls gracefully", async () => {
    const message = "Use an unknown tool";

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call1",
                  function: {
                    name: "unknownTool",
                    arguments: "{}",
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
              content: "Completed without using unknown tool",
            },
          },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(result).toBe("Completed without using unknown tool");
  });

  it("should handle malformed tool arguments", async () => {
    const message = "Test malformed tool args";

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call1",
                  function: {
                    name: "getWeather",
                    arguments: "invalid json",
                  },
                },
              ],
            },
          },
        ],
      },
    });

    await expect(openAi.getChatCompletions(message)).rejects.toThrow();
  });

  it("should add tool responses to message history", async () => {
    const message = "What's the weather in Paris?";
    const weatherResponse = "Paris: Sunny, 20°C";
    (getWeather as jest.Mock).mockResolvedValue(weatherResponse);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call1",
                  function: {
                    name: "getWeather",
                    arguments: '{"location":"Paris"}',
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
              content: "The weather in Paris is sunny",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);

    // Verify message history contains tool response
    const messages = openAi.messages;
    const toolResponse = messages.find((m) => m.role === "tool");
    expect(toolResponse).toBeDefined();
    expect(toolResponse).toEqual({
      role: "tool",
      tool_call_id: "call1",
      content: weatherResponse,
    });
  });

  it("should handle getDateTime tool call", async () => {
    const message = "What time is it?";
    const mockDateTime = "2024-03-20 15:30:00";
    jest
      .spyOn(global.Date.prototype, "toISOString")
      .mockReturnValue(mockDateTime);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "datetime_call",
                  function: {
                    name: "getDateTime",
                    arguments: "{}",
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
              content: "The current time is 15:30",
            },
          },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);
    const toolResponse = openAi.messages.find((m) => m.role === "tool");
    expect(toolResponse?.content).toBe(mockDateTime);
    expect(result).toBe("The current time is 15:30");
  });

  it("should handle getWeatherForecast tool call", async () => {
    const message = "What's the weather forecast for Paris tomorrow?";
    const mockForecast =
      "Paris tomorrow: Partly cloudy, High: 22°C, Low: 15°C";
    (getWeatherForecast as jest.Mock).mockResolvedValue(mockForecast);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "forecast_call",
                  function: {
                    name: "getWeatherForecast",
                    arguments: '{"location":"Paris","date":"2024-03-21"}',
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
              content:
                "Tomorrow's forecast for Paris shows partly cloudy conditions",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getWeatherForecast).toHaveBeenCalledWith("Paris", "2024-03-21");
  });

  it("should handle getHistoricalWeather tool call", async () => {
    const message = "How was the weather in London last week?";
    const mockHistorical = "London on 2024-03-13: Rainy, Average temp: 12°C";
    (getHistoricalWeather as jest.Mock).mockResolvedValue(mockHistorical);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "historical_call",
                  function: {
                    name: "getHistoricalWeather",
                    arguments: '{"location":"London","date":"2024-03-13"}',
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
              content: "Last week in London was rainy",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getHistoricalWeather).toHaveBeenCalledWith("London", "2024-03-13");
  });

  it("should handle getFiatExchangeRate tool call", async () => {
    const message = "What's the exchange rate between USD and EUR?";
    const mockRate = "1 USD = 0.92 EUR";
    (getFiatExchangeRate as jest.Mock).mockResolvedValue(mockRate);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "fiat_call",
                  function: {
                    name: "getFiatExchangeRate",
                    arguments:
                      '{"baseCurrency":"USD","targetCurrency":"EUR"}',
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
              content: "The current exchange rate is 1 USD = 0.92 EUR",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getFiatExchangeRate).toHaveBeenCalledWith("USD", "EUR");
  });

  it("should handle getCryptoExchangeRate tool call", async () => {
    const message = "What's the exchange rate between BTC and ETH?";
    const mockRate = "1 BTC = 15.5 ETH";
    (getCryptoExchangeRate as jest.Mock).mockResolvedValue(mockRate);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "crypto_call",
                  function: {
                    name: "getCryptoExchangeRate",
                    arguments: '{"baseCrypto":"BTC","targetCrypto":"ETH"}',
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
              content: "The current crypto exchange rate is 1 BTC = 15.5 ETH",
            },
          },
        ],
      },
    });

    await openAi.getChatCompletions(message);
    expect(getCryptoExchangeRate).toHaveBeenCalledWith("BTC", "ETH");
  });
});
