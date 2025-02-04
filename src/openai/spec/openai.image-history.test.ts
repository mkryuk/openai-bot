import { OpenAi } from "../openai";

const TEST_CONSTANTS = {
  TEST_IMAGE_URL: "http://example.com/image.png",
  TEST_PROMPT: "Test prompt",
};

describe("OpenAi Image History", () => {
  let openAi: OpenAi;

  beforeEach(() => {
    openAi = new OpenAi("defaultToken");
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
