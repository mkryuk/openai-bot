import { OpenAi } from "../openai";

const TEST_CONSTANTS = {
  DEFAULT_TOKEN: "defaultToken",
  CUSTOM_TOKEN: "customToken",
};

describe("OpenAi Initialization", () => {
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
