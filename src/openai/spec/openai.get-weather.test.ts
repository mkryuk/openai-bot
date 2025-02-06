import { OpenAi } from "../openai";
import {
  getWeather,
  getWeatherForecast,
  getHistoricalWeather,
} from "../../services/weather";

jest.mock("../../services/weather");

describe("OpenAi Weather Tools", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
  });

  it("should handle getWeather tool call", async () => {
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

    const result = await openAi.getChatCompletions(message);
    expect(getWeather).toHaveBeenCalledWith("Paris");
    expect(result).toBe("The weather in Paris is sunny");
  });

  it("should handle getWeatherForecast tool call", async () => {
    const message = "What's the weather forecast for Paris tomorrow?";
    const mockForecast = "Paris tomorrow: Partly cloudy, High: 22°C, Low: 15°C";
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

  afterEach(() => {
    jest.clearAllMocks();
  });
});
