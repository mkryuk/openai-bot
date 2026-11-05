import {
  accessManager,
  bot,
  commandUpdate,
  model,
  replyUpdate,
  setupBotTest,
  textUpdate,
  visitor,
} from "./access-control-fixtures";

describe("Access control for text handlers", () => {
  let telegramApi: jest.SpyInstance;

  beforeEach(() => {
    telegramApi = setupBotTest();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("without access", () => {
    it("rejects /chat with a permission-denied response", async () => {
      await bot.handleUpdate(commandUpdate("/chat", "hello"));

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

    it("ignores chat! without calling the model or replying", async () => {
      await bot.handleUpdate(textUpdate("chat! hello"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(telegramApi).not.toHaveBeenCalled();
    });

    it("ignores replies to the bot before looking up image history", async () => {
      await bot.handleUpdate(replyUpdate("hello"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(model.hasImageHistory).not.toHaveBeenCalled();
      expect(telegramApi).not.toHaveBeenCalled();
    });

    it("ignores questions even when random replies are enabled", async () => {
      model.shouldReply.mockReturnValue(true);

      await bot.handleUpdate(textUpdate("hello?"));

      expect(model.getChatCompletions).not.toHaveBeenCalled();
      expect(model.handleImageVision).not.toHaveBeenCalled();
      expect(model.draw).not.toHaveBeenCalled();

      expect(model.shouldReply).not.toHaveBeenCalled();
      expect(telegramApi).not.toHaveBeenCalled();
    });
  });

  describe("with access", () => {
    beforeEach(() => {
      accessManager.allowedUsersMap.set(visitor.id, visitor);
    });

    it("answers /chat", async () => {
      await bot.handleUpdate(commandUpdate("/chat", "hello"));

      expect(model.getChatCompletions).toHaveBeenCalledTimes(1);
      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test answer" }),
      );
    });

    it("answers chat!", async () => {
      await bot.handleUpdate(textUpdate("chat! hello"));

      expect(model.getChatCompletions).toHaveBeenCalledTimes(1);
      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test answer" }),
      );
    });

    it("answers replies to the bot", async () => {
      await bot.handleUpdate(replyUpdate("hello"));

      expect(model.getChatCompletions).toHaveBeenCalledTimes(1);
      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test answer" }),
      );
    });

    it("answers questions when random replies are enabled", async () => {
      model.shouldReply.mockReturnValue(true);

      await bot.handleUpdate(textUpdate("hello?"));

      expect(model.getChatCompletions).toHaveBeenCalledTimes(1);
      expect(model.getChatCompletions).toHaveBeenCalledWith("hello?");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "Test answer" }),
      );
    });
  });
});
