import { OpenAi } from "./openai";
import { tools } from "./tools";
import { getWeather } from "../services/weather";
jest.mock("../services/weather");

describe("OpenAi", () => {
  let openAi: OpenAi;

  beforeEach(() => {
    openAi = new OpenAi("token");
  });

  it("should handle getWeather tool call in getChatCompletions", async () => {
    const message = "What's the weather in Paris?";
    const weatherResponse = "Weather in Paris: Clear sky, Temperature: 15°C";
    (getWeather as jest.Mock).mockResolvedValue(weatherResponse);

    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValueOnce({
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

    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: "The weather is nice." } }],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(getWeather).toHaveBeenCalledWith("Paris");
    expect(result).toBe("The weather is nice.");
  });

  it("should initialize with default values", () => {
    const defaultOpenAi = new OpenAi("defaultToken");
    expect(defaultOpenAi.maxTokens).toBe(1024);
    expect(defaultOpenAi.temperature).toBe(0.5);
    expect(defaultOpenAi.modelName).toBe("gpt-4o");
    expect(defaultOpenAi.replyProbability).toBe(10);
  });

  it("should throw an error if messageDepth is set to a negative value", () => {
    expect(() => {
      openAi.messageDepth = -1;
    }).toThrow("messageDepth must be a positive integer");
  });

  it("should correctly add a system message", () => {
    const initialSystemMessagesLength = openAi["systemMessages"].length;
    openAi.addSystemMessage("System test message");
    expect(openAi["systemMessages"].length).toBe(
      initialSystemMessagesLength + 1,
    );
  });

  it("should reset the message queue", () => {
    openAi.resetMessageQueue();
    expect(openAi["messageQueue"].length).toBe(0);
  });

  it("should correctly determine if it should reply based on replyProbability", () => {
    openAi.replyProbability = 100; // Should always reply
    expect(openAi.shouldReply()).toBe(true);
    openAi.replyProbability = 0; // Should never reply
    expect(openAi.shouldReply()).toBe(false);
  });

  it("should add and retrieve image history correctly", () => {
    const messageId = 1;
    const imageUrl = "http://example.com/image.png";
    const prompt = "Test prompt";
    openAi.addImageHistory(messageId, imageUrl, prompt);
    const history = openAi.getImageHistory(messageId);
    expect(history).toEqual({ imageUrl, prompt });
  });

  it("should maintain maximum size of 100 entries in image history", () => {
    // Add 110 entries
    for (let i = 1; i <= 110; i++) {
      openAi.addImageHistory(
        i,
        `http://example.com/image${i}.png`,
        `prompt ${i}`,
      );
    }

    // First 10 entries should be removed
    expect(openAi.hasImageHistory(1)).toBe(false);
    expect(openAi.hasImageHistory(10)).toBe(false);
    // Entry 11 should still exist
    expect(openAi.hasImageHistory(11)).toBe(true);
    // Latest entry should exist
    expect(openAi.hasImageHistory(110)).toBe(true);
  });

  it("should replace existing entry with same messageId", () => {
    const messageId = 1;
    const initialUrl = "http://example.com/initial.png";
    const updatedUrl = "http://example.com/updated.png";

    openAi.addImageHistory(messageId, initialUrl, "initial prompt");
    openAi.addImageHistory(messageId, updatedUrl, "updated prompt");

    const history = openAi.getImageHistory(messageId);
    expect(history).toEqual({
      imageUrl: updatedUrl,
      prompt: "updated prompt",
    });
  });

  it("should throw an error when retrieving non-existent image history", () => {
    const nonExistentMessageId = 999;
    expect(() => {
      openAi.getImageHistory(nonExistentMessageId);
    }).toThrow("No image history found for message ID " + nonExistentMessageId);
  });

  it("should correctly check if image history exists", () => {
    const messageId = 2;
    const imageUrl = "http://example.com/image2.png";
    const prompt = "Test prompt 2";
    openAi.addImageHistory(messageId, imageUrl, prompt);
    expect(openAi.hasImageHistory(messageId)).toBe(true);
    expect(openAi.hasImageHistory(999)).toBe(false); // Non-existent ID
  });

  it("should set and add system messages correctly", () => {
    openAi.setSystemMessage("Initial system message");
    expect(openAi["systemMessages"].length).toBe(1);
    openAi.addSystemMessage("Additional system message");
    expect(openAi["systemMessages"].length).toBe(2);
  });

  it("should set the message depth to a positive integer", () => {
    const openAi = new OpenAi("token");
    openAi.messageDepth = 5;
    expect(openAi.messageDepth).toBe(5);
  });

  it("should return all messages", () => {
    const message1 = { role: "user", content: "Message 1" };
    const message2 = { role: "user", content: "Message 2" };
    openAi["messageQueue"] = [message1, message2];
    const systemMessage = { role: "system", content: "System message" };
    openAi["systemMessages"] = [systemMessage];
    expect(openAi.messages).toEqual([systemMessage, message1, message2]);
  });
  it("should initialize with a custom token", () => {
    const customTokenOpenAi = new OpenAi("customToken");
    expect(customTokenOpenAi).toBeDefined();
  });

  it("should handle adding a duplicate system message", () => {
    openAi.addSystemMessage("Duplicate message");
    const initialLength = openAi["systemMessages"].length;
    openAi.addSystemMessage("Duplicate message");
    expect(openAi["systemMessages"].length).toBe(initialLength + 1);
  });

  it("should handle resetting an already empty message queue", () => {
    openAi.resetMessageQueue();
    openAi.resetMessageQueue(); // Reset again
    expect(openAi["messageQueue"].length).toBe(0);
  });

  it("should handle reply probability edge cases", () => {
    openAi.replyProbability = 50; // 50% chance to reply
    const shouldReply = openAi.shouldReply();
    expect(typeof shouldReply).toBe("boolean");
  });
  it("should handle errors in postToOpenAi method", async () => {
    const message = "Hello, OpenAI!";
    jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockRejectedValue(new Error("Network Error"));

    await expect(openAi.getChatCompletions(message)).rejects.toThrow(
      "Network Error",
    );
  });

  it("should handle empty message queue gracefully", async () => {
    openAi.resetMessageQueue();
    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValue({
      data: { choices: [{ message: { content: "" } }] },
    });
    const result = await openAi.getChatCompletions("");
    expect(result).toBe("");
  });

  it("should handle setting a very high message depth", () => {
    openAi.messageDepth = 1000;
    expect(openAi.messageDepth).toBe(1000);
  });
  it("should call OpenAI API to draw an image", async () => {
    const message = "Draw a cat";
    const postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({ data: { url: "http://example.com/image.png" } });

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
    expect(result.data.url).toBe("http://example.com/image.png");
  });

  it("should call OpenAI API to draw image variations", async () => {
    const messageId = 1;
    const imageUrl = "http://example.com/image.png";
    jest
      .spyOn(openAi as any, "getImageUrlFromHistory")
      .mockReturnValue(imageUrl);
    jest
      .spyOn(openAi["httpClient"], "get")
      .mockResolvedValue({ data: Buffer.from("image data") });
    const postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({ data: { url: "http://example.com/variation.png" } });

    const result = await openAi.drawVariations(messageId);
    expect(postToOpenAiSpy).toHaveBeenCalled();
    expect(result.data.url).toBe("http://example.com/variation.png");
  });

  it("should retrieve models list from OpenAI API", async () => {
    const modelsList = { data: { models: ["gpt-3", "gpt-4"] } };
    jest.spyOn(openAi["httpClient"], "get").mockResolvedValue(modelsList);

    const result = await openAi.getModelsList();
    expect(result).toEqual(modelsList);
  });

  it("should set a system message", () => {
    const systemMessage = "System initialization message";
    openAi.setSystemMessage(systemMessage);
    expect(openAi["systemMessages"]).toEqual([
      { role: "system", content: systemMessage },
    ]);
  });
});

describe("getChatCompletions", () => {
  let openAi: OpenAi;
  beforeEach(() => {
    openAi = new OpenAi("token");
  });

  it("should handle tool calls and process tool responses", async () => {
    const message = "What's the weather in Paris?";
    const weatherResponse = "Weather in Paris: Clear sky, Temperature: 15°C";
    (getWeather as jest.Mock).mockResolvedValue(weatherResponse);

    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValueOnce({
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

    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValueOnce({
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
    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValue({
      data: {
        choices: [{ message: { content: "Why did the chicken cross the road?" } }],
      },
    });

    const result = await openAi.getChatCompletions(message);
    expect(result).toBe("Why did the chicken cross the road?");
  });

  it("should add user message to message history", async () => {
    const message = "Hello, OpenAI!";
    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValue({
      data: { choices: [{ message: { content: "Hello, User!" } }] },
    });
    await openAi.getChatCompletions(message);
    expect(openAi.messages).toContainEqual({ role: "user", content: message });
  });

  it("should send a request to OpenAI API with correct parameters", async () => {
    const message = "Hello, OpenAI!";
    const postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue({
        data: { choices: [{ message: { content: "Hello, User!" } }] },
      });
    await openAi.getChatCompletions(message);
    expect(postToOpenAiSpy).toHaveBeenCalledWith(openAi.chatCompletionsUrl, {
      model: openAi.modelName,
      messages: [{ role: "user", content: "Hello, OpenAI!" }],
      max_tokens: openAi.maxTokens,
      temperature: openAi.temperature,
      tools: tools,
    });
  });

  it("should add assistant message to message history", async () => {
    const message = "Hello, OpenAI!";
    const response = {
      data: {
        choices: [{ message: { content: "Hello, User!" } }],
      },
    };
    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValue(response);
    await openAi.getChatCompletions(message);
    expect(openAi.messages).toContainEqual({
      role: "assistant",
      content: response.data.choices[0].message.content,
    });
  });

  it("should return the content of the assistant message", async () => {
    const message = "Hello, OpenAI!";
    const response = {
      data: {
        choices: [{ message: { content: "Hello, User!" } }],
      },
    };
    jest.spyOn(openAi as any, "postToOpenAi").mockResolvedValue(response);
    const result = await openAi.getChatCompletions(message);
    expect(result).toBe(response.data.choices[0].message.content);
  });
});
