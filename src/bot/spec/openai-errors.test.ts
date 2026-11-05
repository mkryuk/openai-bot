import { inspect } from "util";
import { Telegram } from "telegraf";
import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import "../middlewares";
import "../commands";
import "../hears";

jest.mock("../bot", () => {
  const { Telegraf } = jest.requireActual("telegraf");
  const bot = new Telegraf("123:TEST_TOKEN");
  bot.botInfo = {
    id: 99,
    is_bot: true,
    first_name: "Test",
    username: "test_bot",
  };
  return { bot };
});

jest.mock("../access-manager", () => ({
  accessManager: {
    isAdminUser: () => true,
    allowedUsersMap: new Map(),
    allowedGroupsMap: new Map(),
  },
}));

jest.mock("../../openai/openai", () => {
  const actual = jest.requireActual("../../openai/openai");
  return { ...actual, openAi: new actual.OpenAi("test-private-token") };
});

describe("OpenAI errors through bot handlers", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(["/chat hello", "chat! hello", "/draw cat", "/get_models"])(
    "does not expose credentials in logs or replies for %s",
    async (text) => {
      const token = "test-private-token";
      const rawError = {
        message: "Request failed with status code 401",
        code: "ERR_BAD_REQUEST",
        config: { headers: { Authorization: `Bearer ${token}` } },
        response: {
          status: 401,
          data: { error: { message: `Invalid API key: ${token}` } },
        },
      };
      openAi.resetMessageQueue();
      jest.spyOn(openAi["httpClient"], "post").mockRejectedValue(rawError);
      jest.spyOn(openAi["httpClient"], "get").mockRejectedValue(rawError);
      jest.spyOn(console, "log").mockImplementation(() => {});
      const errors = jest.spyOn(console, "error").mockImplementation(() => {});
      const telegram = jest
        .spyOn(Telegram.prototype, "callApi")
        .mockResolvedValue({ message_id: 10 });
      const command = text.split(" ")[0];

      await bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1,
          date: 1,
          from: { id: 1, is_bot: false, first_name: "Test" },
          chat: { id: 1, type: "private", first_name: "Test" },
          text,
          entities: text.startsWith("/")
            ? [{ type: "bot_command", offset: 0, length: command.length }]
            : [],
        },
      });

      expect(errors).toHaveBeenCalled();
      expect(telegram).toHaveBeenCalledWith("sendMessage", expect.any(Object));
      expect(inspect(errors.mock.calls, { depth: null })).not.toContain(token);
      expect(inspect(telegram.mock.calls, { depth: null })).not.toContain(
        token,
      );
      if (text.startsWith("/chat")) {
        expect(telegram).toHaveBeenCalledWith(
          "sendMessage",
          expect.objectContaining({
            text: expect.stringContaining("Invalid API key: [REDACTED]"),
          }),
        );
      }
    },
  );
});
