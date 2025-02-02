import { OpenAi } from "./openai";
import { tools } from "./tools";
import { getWeather } from "../services/weather";
jest.mock("../services/weather");

const TEST_CONSTANTS = {
  DEFAULT_TOKEN: "defaultToken",
  CUSTOM_TOKEN: "customToken",
  TEST_IMAGE_URL: "http://example.com/image.png",
  TEST_PROMPT: "Test prompt",
  MOCK_API_RESPONSE: {
    data: { choices: [{ message: { content: "Hello, User!" } }] },
  },
};

describe("OpenAi", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi(TEST_CONSTANTS.DEFAULT_TOKEN);
    postToOpenAiSpy = jest
      .spyOn(openAi as any, "postToOpenAi")
      .mockResolvedValue(TEST_CONSTANTS.MOCK_API_RESPONSE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const defaultOpenAi = new OpenAi(TEST_CONSTANTS.DEFAULT_TOKEN);
      expect(defaultOpenAi.maxTokens).toBe(1024);
      expect(defaultOpenAi.temperature).toBe(0.5);
      expect(defaultOpenAi.modelName).toBe("gpt-4o");
      expect(defaultOpenAi.replyProbability).toBe(10);
    });

    it("should initialize with a custom token", () => {
      const customTokenOpenAi = new OpenAi(TEST_CONSTANTS.CUSTOM_TOKEN);
      expect(customTokenOpenAi).toBeDefined();
    });
  });

  describe("System Messages", () => {
    it("should correctly add a system message", () => {
      const initialSystemMessagesLength = openAi["systemMessages"].length;
      openAi.addSystemMessage("System test message");
      expect(openAi["systemMessages"].length).toBe(
        initialSystemMessagesLength + 1,
      );
    });

    it("should set and add system messages correctly", () => {
      openAi.setSystemMessage("Initial system message");
      expect(openAi["systemMessages"].length).toBe(1);
      openAi.addSystemMessage("Additional system message");
      expect(openAi["systemMessages"].length).toBe(2);
    });

    it("should handle adding a duplicate system message", () => {
      openAi.addSystemMessage("Duplicate message");
      const initialLength = openAi["systemMessages"].length;
      openAi.addSystemMessage("Duplicate message");
      expect(openAi["systemMessages"].length).toBe(initialLength + 1);
    });

    it("should set a system message", () => {
      const systemMessage = "System initialization message";
      openAi.setSystemMessage(systemMessage);
      expect(openAi["systemMessages"]).toEqual([
        { role: "system", content: systemMessage },
      ]);
    });
  });

  describe("Message Queue", () => {
    it("should reset the message queue", () => {
      openAi.resetMessageQueue();
      expect(openAi["messageQueue"].length).toBe(0);
    });

    it("should handle resetting an already empty message queue", () => {
      openAi.resetMessageQueue();
      openAi.resetMessageQueue(); // Reset again
      expect(openAi["messageQueue"].length).toBe(0);
    });

    it("should add user message to message history", async () => {
      const message = "Hello, OpenAI!";
      await openAi.getChatCompletions(message);
      expect(openAi.messages).toContainEqual({
        role: "user",
        content: message,
      });
    });

    it("should add assistant message to message history", async () => {
      const message = "Hello, OpenAI!";
      await openAi.getChatCompletions(message);
      expect(openAi.messages).toContainEqual({
        role: "assistant",
        content:
          TEST_CONSTANTS.MOCK_API_RESPONSE.data.choices[0].message.content,
      });
    });

    it("should return all messages", () => {
      const message1 = { role: "user", content: "Message 1" };
      const message2 = { role: "user", content: "Message 2" };
      openAi["messageQueue"] = [message1, message2];
      const systemMessage = { role: "system", content: "System message" };
      openAi["systemMessages"] = [systemMessage];
      expect(openAi.messages).toEqual([systemMessage, message1, message2]);
    });

    it("should handle messages with special characters", async () => {
      const message = "Hello 👋 OpenAI! \n\t";
      await openAi.getChatCompletions(message);
      expect(openAi.messages).toContainEqual({
        role: "user",
        content: message,
      });
    });

    it("should handle maximum message depth", async () => {
      openAi.messageDepth = 2;

      // directly set the message queue
      openAi["messageQueue"] = [
        { role: "user", content: "Message 2" },
        { role: "assistant", content: "Response 2" },
      ];

      // add one more message
      await openAi.getChatCompletions("Message 3");

      // should contain only user messages in order
      const messages = openAi.messages.filter((m) => m.role === "user");
      expect(messages).toEqual([{ role: "user", content: "Message 3" }]);
    });
  });

  describe("Image History", () => {
    beforeEach(() => {
      // clear image history before each test
      (openAi as any).imageHistory = new Map();
    });

    it("should add and retrieve image history correctly", () => {
      const messageId = 1;
      const imageUrl = TEST_CONSTANTS.TEST_IMAGE_URL;
      const prompt = TEST_CONSTANTS.TEST_PROMPT;
      openAi.addImageHistory(messageId, imageUrl, prompt);
      const history = openAi.getImageHistory(messageId);
      expect(history).toEqual({ imageUrl, prompt });
    });

    it("should maintain maximum size of 100 entries in image history", () => {
      // add 110 entries
      for (let i = 1; i <= 110; i++) {
        openAi.addImageHistory(
          i,
          `http://example.com/image${i}.png`,
          `prompt ${i}`,
        );
      }

      // first 10 entries should be removed
      expect(openAi.hasImageHistory(1)).toBe(false);
      expect(openAi.hasImageHistory(10)).toBe(false);
      // entry 11 should still exist
      expect(openAi.hasImageHistory(11)).toBe(true);
      // latest entry should exist
      expect(openAi.hasImageHistory(110)).toBe(true);
    });

    it("should replace existing entry with same messageId", () => {
      const messageId = 1;
      const initialUrl = TEST_CONSTANTS.TEST_IMAGE_URL;
      const updatedUrl = "http://example.com/updated.png";

      openAi.addImageHistory(messageId, initialUrl, TEST_CONSTANTS.TEST_PROMPT);
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
      }).toThrow(
        "No image history found for message ID " + nonExistentMessageId,
      );
    });

    it("should correctly check if image history exists", () => {
      const messageId = 2;
      const imageUrl = "http://example.com/image2.png";
      const prompt = "Test prompt 2";
      openAi.addImageHistory(messageId, imageUrl, prompt);
      expect(openAi.hasImageHistory(messageId)).toBe(true);
      expect(openAi.hasImageHistory(999)).toBe(false); // Non-existent ID
    });
  });

  describe("Reply Probability", () => {
    it("should correctly determine if it should reply based on replyProbability", () => {
      openAi.replyProbability = 100; // should always reply
      expect(openAi.shouldReply()).toBe(true);
      openAi.replyProbability = 0; // should never reply
      expect(openAi.shouldReply()).toBe(false);
    });

    it("should handle reply probability edge cases", () => {
      openAi.replyProbability = 50; // 50% chance to reply
      const shouldReply = openAi.shouldReply();
      expect(typeof shouldReply).toBe("boolean");
    });
  });

  describe("Message Depth", () => {
    it("should throw an error if messageDepth is set to a negative value", () => {
      expect(() => {
        openAi.messageDepth = -1;
      }).toThrow("messageDepth must be a positive integer");
    });

    it("should set the message depth to a positive integer", () => {
      const openAi = new OpenAi(TEST_CONSTANTS.DEFAULT_TOKEN);
      openAi.messageDepth = 5;
      expect(openAi.messageDepth).toBe(5);
    });

    it("should handle setting a very high message depth", () => {
      openAi.messageDepth = 1000;
      expect(openAi.messageDepth).toBe(1000);
    });
  });

  describe("API Calls", () => {
    it("should handle errors in postToOpenAi method", async () => {
      const message = "Hello, OpenAI!";
      postToOpenAiSpy.mockRejectedValueOnce(new Error("Network Error"));

      await expect(openAi.getChatCompletions(message)).rejects.toThrow(
        "Network Error",
      );
    });

    it("should handle empty message queue gracefully", async () => {
      openAi.resetMessageQueue();
      postToOpenAiSpy.mockResolvedValueOnce({
        data: { choices: [{ message: { content: "" } }] },
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

    it("should handle rate limiting errors", async () => {
      postToOpenAiSpy.mockRejectedValueOnce(
        new Error("429: Too Many Requests"),
      );

      await expect(openAi.getChatCompletions("test")).rejects.toThrow(
        "429: Too Many Requests",
      );
    });

    it("should handle malformed API responses", async () => {
      postToOpenAiSpy.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: null } }],
        },
      });
      const result = await openAi.getChatCompletions("test");
      expect(result).toBeNull(); // expect null for null content
    });
  });

  describe("getChatCompletions", () => {
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
      expect(postToOpenAiSpy).toHaveBeenCalledWith(openAi.chatCompletionsUrl, {
        model: openAi.modelName,
        messages: [{ role: "user", content: "Hello, OpenAI!" }],
        max_tokens: openAi.maxTokens,
        temperature: openAi.temperature,
        tools: tools,
      });
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
});
