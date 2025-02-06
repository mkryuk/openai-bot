import { OpenAi } from "../openai";

const TEST_CONSTANTS = {
  MOCK_API_RESPONSE: {
    data: { choices: [{ message: { content: "Hello, User!" } }] },
  },
};

describe("OpenAi Message Queue", () => {
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

  it("should reset the message queue", () => {
    openAi.resetMessageQueue();
    expect(openAi["messageQueue"].length).toBe(0);
  });

  it("should handle resetting an already empty message queue", () => {
    openAi.resetMessageQueue();
    openAi.resetMessageQueue(); // Reset again
    expect(openAi["messageQueue"].length).toBe(0);
  });

  it("should properly manage message history with user and assistant messages", async () => {
    const message = "Hello, OpenAI!";
    await openAi.getChatCompletions(message);

    // Check both user and assistant messages in one test
    expect(openAi.messages).toContainEqual({
      role: "user",
      content: message,
    });
    expect(openAi.messages).toContainEqual({
      role: "assistant",
      content: TEST_CONSTANTS.MOCK_API_RESPONSE.data.choices[0].message.content,
    });
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
      content: TEST_CONSTANTS.MOCK_API_RESPONSE.data.choices[0].message.content,
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
      { role: "user", content: "Message 3" },
      { role: "assistant", content: "Response 3" },
    ];

    // add one more message
    await openAi.getChatCompletions("Message 4");

    // should contain only user messages in order
    const messages = openAi.messages.filter((m) => m.role === "user");
    expect(messages).toEqual([
      { role: "user", content: "Message 3" },
      { role: "user", content: "Message 4" },
    ]);
  });
});
