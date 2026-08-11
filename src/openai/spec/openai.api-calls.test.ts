import { OpenAi } from "../openai";
import { responseText } from "./responses-fixtures";

const TEST_CONSTANTS = {
  TEST_IMAGE_URL: "http://example.com/image.png",
  MOCK_API_RESPONSE: responseText("Hello, User!"),
};

describe("OpenAi API Calls", () => {
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

  it("should handle errors in postToOpenAi method", async () => {
    const message = "Hello, OpenAI!";
    postToOpenAiSpy.mockRejectedValueOnce(new Error("Network Error"));

    await expect(openAi.getChatCompletions(message)).rejects.toThrow(
      "Network Error",
    );
  });

  it("should not log OpenAI authorization headers on API errors", async () => {
    postToOpenAiSpy.mockRestore();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.spyOn(openAi["httpClient"], "post").mockRejectedValueOnce({
      message: "Request failed with status code 400",
      code: "ERR_BAD_REQUEST",
      config: {
        headers: {
          Authorization: "Bearer secret-token",
        },
      },
      response: {
        status: 400,
        statusText: "Bad Request",
        data: {
          error: {
            message: "Invalid request",
          },
        },
      },
    });

    await expect(
      (openAi as any).postToOpenAi(OpenAi.API_URLS.responses, {}),
    ).rejects.toMatchObject({
      code: "ERR_BAD_REQUEST",
    });

    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(
      "secret-token",
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle empty message queue gracefully", async () => {
    openAi.resetMessageQueue();
    postToOpenAiSpy.mockResolvedValueOnce({
      data: { output_text: "" },
    });
    const result = await openAi.getChatCompletions("");
    expect(result).toBe("");
  });

  it("should call OpenAI API to draw an image", async () => {
    const message = "Draw a cat";
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({ data: { url: TEST_CONSTANTS.TEST_IMAGE_URL } });

    const result = await openAi.draw(message);
    expect(postToOpenAiSpy).toHaveBeenCalledWith(
      "https://api.openai.com/v1/images/generations",
      {
        model: "dall-e-3",
        prompt: message,
        n: 1,
        size: "1024x1024",
        style: "vivid",
        quality: "standard",
      },
    );
    expect(result.data.url).toBe(TEST_CONSTANTS.TEST_IMAGE_URL);
  });

  it("should call OpenAI API to draw image variations", async () => {
    const messageId = 1;
    const imageUrl = TEST_CONSTANTS.TEST_IMAGE_URL;
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "getImageUrlFromHistory")
      .mockReturnValue(imageUrl);
    postToOpenAiSpy = jest
      .spyOn(openAi["httpClient"], "get")
      .mockResolvedValue({ data: Buffer.from("image data") });
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({
        data: { url: "http://example.com/variation.png" },
      });

    const result = await openAi.drawVariations(messageId);
    expect(postToOpenAiSpy).toHaveBeenCalled();
    expect(result.data.url).toBe("http://example.com/variation.png");
  });

  it("should retrieve models list from OpenAI API", async () => {
    const modelsList = { data: { models: ["gpt-3", "gpt-4"] } };
    postToOpenAiSpy = jest
      .spyOn(openAi["httpClient"], "get")
      .mockResolvedValue(modelsList);

    const result = await openAi.getModelsList();
    expect(result).toEqual(modelsList);
  });

  it("should call Responses API for image vision", async () => {
    const imageUrl = TEST_CONSTANTS.TEST_IMAGE_URL;
    const text = "What is in this image?";
    postToOpenAiSpy.mockResolvedValueOnce(responseText("A test image"));

    const result = await openAi.handleImageVision(imageUrl, text);

    expect(postToOpenAiSpy).toHaveBeenCalledWith(OpenAi.API_URLS.responses, {
      model: openAi.modelName,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
      max_output_tokens: openAi.maxTokens,
      reasoning: { effort: openAi.reasoningEffort },
    });
    expect(result).toBe("A test image");
  });

  it("should handle rate limiting errors", async () => {
    postToOpenAiSpy.mockRejectedValueOnce(new Error("429: Too Many Requests"));

    await expect(openAi.getChatCompletions("test")).rejects.toThrow(
      "429: Too Many Requests",
    );
  });

  it("should handle malformed API responses", async () => {
    postToOpenAiSpy.mockResolvedValueOnce({
      data: {
        output_text: null,
      },
    });
    const result = await openAi.getChatCompletions("test");
    expect(result).toBeNull(); // expect null for null content
  });
});
