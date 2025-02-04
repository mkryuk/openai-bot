import { OpenAi } from "../openai";

describe("OpenAi Reply Probability", () => {
  let openAi: OpenAi;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
  });

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
