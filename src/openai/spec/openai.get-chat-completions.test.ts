import { OpenAi } from "../openai";
import { getWeather } from "../../services/weather";
import { tools } from "../tools";
import { responseFunctionCall, responseText } from "./responses-fixtures";

jest.mock("../../services/weather");
jest.mock("../../services/currency");

const TEST_CONSTANTS = {
  MOCK_API_RESPONSE: responseText("Hello, User!"),
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

    postToOpenAiSpy.mockResolvedValueOnce(
      responseFunctionCall("tool_call_id_1", "getWeather", {
        location: "Paris",
      }),
    );

    postToOpenAiSpy.mockResolvedValueOnce(responseText("The weather is nice."));

    const result = await openAi.getChatCompletions(message);
    expect(getWeather).toHaveBeenCalledWith("Paris");
    expect(postToOpenAiSpy).toHaveBeenLastCalledWith(
      OpenAi.API_URLS.responses,
      expect.objectContaining({
        input: expect.arrayContaining([
          expect.objectContaining({
            type: "function_call",
            call_id: "tool_call_id_1",
            name: "getWeather",
          }),
          expect.objectContaining({
            type: "function_call_output",
            call_id: "tool_call_id_1",
            output: weatherResponse,
          }),
        ]),
      }),
    );
    expect(result).toBe("The weather is nice.");
  });

  it("should handle empty tool calls gracefully", async () => {
    const message = "Tell me a joke.";
    postToOpenAiSpy.mockResolvedValueOnce(
      responseText("Why did the chicken cross the road?"),
    );

    const result = await openAi.getChatCompletions(message);
    expect(result).toBe("Why did the chicken cross the road?");
  });

  it("should send a request to OpenAI API with correct parameters", async () => {
    const message = "Hello, OpenAI!";
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(responseText("Hello, User!"));
    await openAi.getChatCompletions(message);
    expect(postToOpenAiSpy).toHaveBeenCalledWith(OpenAi.API_URLS.responses, {
      model: openAi.modelName,
      input: [{ role: "user", content: "Hello, OpenAI!" }],
      max_output_tokens: openAi.maxTokens,
      reasoning: { effort: openAi.reasoningEffort },
      tools: tools.map((tool) => ({
        type: tool.type,
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
        strict: tool.function.strict,
      })),
    });
  });

  it("should include configured system messages in Responses input", async () => {
    const systemMessage = "Reply in plain text only.";
    openAi.setSystemMessages([systemMessage]);
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(responseText("Hello, User!"));

    await openAi.getChatCompletions("Hello");

    expect(postToOpenAiSpy).toHaveBeenCalledWith(
      OpenAi.API_URLS.responses,
      expect.objectContaining({
        input: [
          { role: "system", content: systemMessage },
          { role: "user", content: "Hello" },
        ],
      }),
    );
  });

  it("should omit reasoning for legacy model overrides", async () => {
    const legacyOpenAi = new OpenAi(
      "defaultToken",
      1024,
      0.5,
      "gpt-4o",
      10,
      "low",
    );
    const legacyPostToOpenAiSpy = jest
      .spyOn(legacyOpenAi as any, "postToOpenAi")
      .mockResolvedValue(responseText("Hello, User!"));

    await legacyOpenAi.getChatCompletions("Hello");

    expect(legacyPostToOpenAiSpy).toHaveBeenCalledWith(
      OpenAi.API_URLS.responses,
      expect.not.objectContaining({
        reasoning: expect.anything(),
      }),
    );
  });

  it("should return the content of the assistant message", async () => {
    const message = "Hello, OpenAI!";
    const response = {
      data: { output_text: "Hello, User!" },
    };
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(response);
    const result = await openAi.getChatCompletions(message);
    expect(result).toBe(response.data.output_text);
  });
});
