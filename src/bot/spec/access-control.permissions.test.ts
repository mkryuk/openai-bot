import {
  accessManager,
  bot,
  commandUpdate,
  group,
  isAdminUser,
  model,
  setupBotTest,
  visitor,
} from "./access-control-fixtures";

describe("Access permissions through the bot handler chain", () => {
  let telegramApi: jest.SpyInstance;

  beforeEach(() => {
    telegramApi = setupBotTest();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("chat access", () => {
    it("allows the administrator in a group outside allowedGroups", async () => {
      isAdminUser.mockReturnValue(true);

      await bot.handleUpdate(commandUpdate("/chat", "hello"));

      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
    });

    it("allows a listed user in a group outside allowedGroups", async () => {
      accessManager.allowedUsersMap.set(visitor.id, visitor);

      await bot.handleUpdate(commandUpdate("/chat", "hello"));

      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
    });

    it("allows an unlisted user in an allowed group", async () => {
      accessManager.allowedGroupsMap.set(group.id, group);

      await bot.handleUpdate(commandUpdate("/chat", "hello"));

      expect(model.getChatCompletions).toHaveBeenCalledWith("hello");
    });
  });

  describe("administrative commands", () => {
    it("lets the administrator change the model", async () => {
      isAdminUser.mockReturnValue(true);

      await bot.handleUpdate(commandUpdate("/set_model", "changed-model"));

      expect(model.modelName).toBe("changed-model");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({ text: "model changed to changed-model" }),
      );
    });

    it("does not let an allowed user change the model", async () => {
      accessManager.allowedUsersMap.set(visitor.id, visitor);

      await bot.handleUpdate(commandUpdate("/set_model", "changed-model"));

      expect(model.modelName).toBe("original-model");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({
          text: "You're not authorized to use this command.",
        }),
      );
    });

    it("does not let an allowed group member change the model", async () => {
      accessManager.allowedGroupsMap.set(group.id, group);

      await bot.handleUpdate(commandUpdate("/set_model", "changed-model"));

      expect(model.modelName).toBe("original-model");
      expect(telegramApi).toHaveBeenCalledWith(
        "sendMessage",
        expect.objectContaining({
          text: "You're not authorized to use this command.",
        }),
      );
    });
  });
});
