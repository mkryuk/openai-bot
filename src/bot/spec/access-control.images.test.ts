import {
  accessManager,
  bot,
  commandUpdate,
  model,
  photoUpdate,
  replyUpdate,
  setupBotTest,
  visitor,
} from "./access-control-fixtures";

describe("Access control for image handlers", () => {
  let telegramApi: jest.SpyInstance;

  beforeEach(() => {
    telegramApi = setupBotTest();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("without access", () => {
    it("rejects a photo command before downloading the file", async () => {
      await bot.handleUpdate(photoUpdate("/chat describe this"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(telegramApi).toHaveBeenCalledTimes(1);
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({
          text: "Sorry, you don't have permission to use this bot.",
        }),
      );
    });

    it("ignores replies to generated images before reading their history", async () => {
      model.hasImageHistory.mockReturnValue(true);

      await bot.handleUpdate(replyUpdate("describe this"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(model.hasImageHistory).not.toHaveBeenCalled();
      expect(model.getImageHistory).not.toHaveBeenCalled();
      expect(telegramApi).not.toHaveBeenCalled();
    });

    it("rejects /draw before generating an image", async () => {
      await bot.handleUpdate(commandUpdate("/draw", "a cat"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(telegramApi).toHaveBeenCalledTimes(1);
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({
          text: "Sorry, you don't have permission to use this bot.",
        }),
      );
    });
  });

  describe("with access", () => {
    beforeEach(() => {
      accessManager.allowedUsersMap.set(visitor.id, visitor);
    });

    it("downloads and analyzes a photo command", async () => {
      await bot.handleUpdate(photoUpdate("/chat describe this"));

      expect(telegramApi).toHaveBeenCalledWith("getFile", { file_id: "photo" });
      expect(model.handleImageVision).toHaveBeenCalledTimes(1);
      expect(model.handleImageVision).toHaveBeenCalledWith(
        expect.stringContaining("photos/test.jpg"),
        "describe this",
      );
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test image answer" }),
      );
    });

    it("analyzes the stored image when replying to a generated image", async () => {
      model.hasImageHistory.mockReturnValue(true);

      await bot.handleUpdate(replyUpdate("describe this"));

      expect(model.getImageHistory).toHaveBeenCalledWith(9);
      expect(model.handleImageVision).toHaveBeenCalledTimes(1);
      expect(model.handleImageVision).toHaveBeenCalledWith(
        "https://example.invalid/image.png",
        "describe this",
      );
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test image answer" }),
      );
    });

    it("generates and sends an image for /draw", async () => {
      await bot.handleUpdate(commandUpdate("/draw", "a cat"));

      expect(model.draw).toHaveBeenCalledTimes(1);
      expect(model.draw).toHaveBeenCalledWith("a cat");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendPhoto",
        expect.objectContaining({ photo: "https://example.invalid/image.png" }),
      );
    });
  });
});
