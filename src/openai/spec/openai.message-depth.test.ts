import { OpenAi } from "../openai";

describe("OpenAi Message Depth", () => {
  let openAi: OpenAi;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
  });

  it("should throw an error if messageDepth is set to a negative value", () => {
    expect(() => {
      openAi.messageDepth = -1;
    }).toThrow("messageDepth must be a positive integer");
  });

  it("should set the message depth to a positive integer", () => {
    openAi.messageDepth = 5;
    expect(openAi.messageDepth).toBe(5);
  });

  it("should handle setting a very high message depth", () => {
    openAi.messageDepth = 1000;
    expect(openAi.messageDepth).toBe(1000);
  });
});
