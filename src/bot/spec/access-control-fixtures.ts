import { Telegram } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import { bot } from "../bot";
import { accessManager } from "../access-manager";
import { openAi } from "../../openai/openai";
import "../middlewares";
import "../commands";
import "../hears";
import "../on";

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
    isAdminUser: jest.fn(),
    allowedUsersMap: new Map(),
    allowedGroupsMap: new Map(),
  },
}));

jest.mock("../../openai/openai", () => ({
  openAi: {
    getChatCompletions: jest.fn(),
    handleImageVision: jest.fn(),
    draw: jest.fn(),
    addImageHistory: jest.fn(),
    shouldReply: jest.fn(),
    hasImageHistory: jest.fn(),
    getImageHistory: jest.fn(),
    modelName: "original-model",
  },
}));

export { bot, accessManager };
export const model = jest.mocked(openAi);
export const isAdminUser = jest.mocked(accessManager.isAdminUser);
export const visitor = { id: 1, userName: "visitor" };
export const group = { id: -100, title: "Test group" };

const baseMessage = {
  message_id: 1,
  date: 1,
  from: { id: visitor.id, is_bot: false, first_name: "Visitor" },
  chat: { id: group.id, type: "group" as const, title: group.title },
};

export function textUpdate(
  text: string,
): Update.MessageUpdate<Message.TextMessage> {
  return { update_id: 1, message: { ...baseMessage, text } };
}

export function commandUpdate(command: string, argument: string) {
  const update = textUpdate(`${command} ${argument}`);
  update.message.entities = [
    { type: "bot_command", offset: 0, length: command.length },
  ];
  return update;
}

export function replyUpdate(text: string) {
  const update = textUpdate(text);
  update.message.reply_to_message = {
    ...baseMessage,
    message_id: 9,
    from: bot.botInfo!,
    text: "Previous bot response",
  };
  return update;
}

export function photoUpdate(
  caption: string,
): Update.MessageUpdate<Message.PhotoMessage> {
  return {
    update_id: 1,
    message: {
      ...baseMessage,
      caption,
      photo: [
        { file_id: "photo", file_unique_id: "photo", width: 100, height: 100 },
      ],
    },
  };
}

// Called explicitly in each suite's beforeEach. No network or working config is used.
export function setupBotTest() {
  jest.clearAllMocks();
  isAdminUser.mockReturnValue(false);
  accessManager.allowedUsersMap.clear();
  accessManager.allowedGroupsMap.clear();
  model.getChatCompletions.mockResolvedValue("Test answer");
  model.handleImageVision.mockResolvedValue("Test image answer");
  model.draw.mockResolvedValue({
    data: { data: [{ url: "https://example.invalid/image.png" }] },
  });
  model.shouldReply.mockReturnValue(true);
  model.hasImageHistory.mockReturnValue(false);
  model.getImageHistory.mockReturnValue({
    imageUrl: "https://example.invalid/image.png",
    prompt: "test",
  });
  model.modelName = "original-model";
  jest.spyOn(console, "log").mockImplementation(() => {});

  // handleUpdate creates Telegram instances, so intercept calls on the prototype.
  return jest
    .spyOn(Telegram.prototype, "callApi")
    .mockImplementation(async (method) => {
      if (method === "sendMessage" || method === "sendPhoto") {
        return { message_id: 10 } as any;
      }
      if (method === "getFile") {
        return { file_path: "photos/test.jpg" } as any;
      }
      throw new Error(`Unexpected Telegram API call: ${method}`);
    });
}
