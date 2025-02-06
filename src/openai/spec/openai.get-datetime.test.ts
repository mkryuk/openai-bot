import { OpenAi } from "../openai";

describe("OpenAi getDateTime Tool", () => {
  let openAi: OpenAi;
  let postToOpenAiSpy: jest.SpyInstance;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
    postToOpenAiSpy = jest.spyOn(openAi as any, "postToOpenAi");
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

  afterEach(() => {
    jest.clearAllMocks();
  });
});
