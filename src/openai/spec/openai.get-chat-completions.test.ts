import { OpenAi } from "../openai";
import { getWeather } from "../../services/weather";
import { tools } from "../tools";

jest.mock("../../services/weather");
jest.mock("../../services/currency");

const TEST_CONSTANTS = {
  MOCK_API_RESPONSE: {
    data: { choices: [{ message: { content: "Hello, User!" } }] },
  },
};

describe("OpenAi getChatCompletions", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(TEST_CONSTANTS.MOCK_API_RESPONSE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle tool calls and process tool responses", async () => {
    const message = "What's the weather in Paris?";
    const weatherResponse = "Weather in Paris: Clear sky, Temperature: 15°C";
    (getWeather as jest.Mock).mockResolvedValue(weatherResponse);

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    name: "getWeather",
                    arguments: '{"location":"Paris"}',
                  },
                  id: "tool_call_id_1",
                },
              ],
            },
          },
        ],
      },
    });

    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: "The weather is nice." } }],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(getWeather).toHaveBeenCalledWith("Paris");
    expect(result).toBe("The weather is nice.");
  });

  it("should handle empty tool calls gracefully", async () => {
    const message = "Tell me a joke.";
    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        choices: [
          { message: { content: "Why did the chicken cross the road?" } },
        ],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(result).toBe("Why did the chicken cross the road?");
  });

  it("should send a request to OpenAI API with correct parameters", async () => {
    const message = "Hello, OpenAI!";
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({
        data: { choices: [{ message: { content: "Hello, User!" } }] },
      });
    await openAi.getChatCompletions(message);
    expect(postToOpenAiSpy).toHaveBeenCalledWith(
      OpenAi.API_URLS.chatCompletions,
      {
        model: openAi.modelName,
        messages: [{ role: "user", content: "Hello, OpenAI!" }],
        max_tokens: openAi.maxTokens,
        temperature: openAi.temperature,
        tools: tools,
      },
    );
  });

  it("should return the content of the assistant message", async () => {
    const message = "Hello, OpenAI!";
    const response = {
      data: {
        choices: [{ message: { content: "Hello, User!" } }],
      },
    };
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(response);
    const result = await openAi.getChatCompletions(message);
    expect(result).toBe(response.data.choices[0].message.content);
  });
});
