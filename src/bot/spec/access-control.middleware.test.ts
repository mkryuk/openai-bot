import { MiddlewareFn } from "telegraf";
import { OaiContext, bot } from "../bot";
import { accessManager } from "../access-manager";
import "../middlewares/access-control.middleware";

jest.mock("../bot", () => ({ bot: { use: jest.fn() } }));
jest.mock("../access-manager", () => ({
  accessManager: {
    isAdminUser: jest.fn(),
    allowedUsersMap: new Map(),
    allowedGroupsMap: new Map(),
  },
}));

const [middleware] = (bot.use as jest.Mock).mock.calls[0] as [
  MiddlewareFn<OaiContext>,
];
const isAdminUser = jest.mocked(accessManager.isAdminUser);

function makeContext(message: Record<string, unknown>) {
  const reply = jest.fn().mockResolvedValue({ message_id: 10 });
  const ctx = {
    from: { id: 1, username: "visitor" },
    chat: { id: -100, title: "Test group" },
    updateType: "message",
    message,
    reply,
  } as unknown as OaiContext;
  return { ctx, reply, next: jest.fn().mockResolvedValue(undefined) };
}

describe("Access control middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAdminUser.mockReturnValue(false);
    accessManager.allowedUsersMap.clear();
    accessManager.allowedGroupsMap.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  describe("allowed messages", () => {
    it("continues for the administrator", async () => {
      isAdminUser.mockReturnValue(true);
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });

      await middleware(ctx, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(reply).not.toHaveBeenCalled();
    });

    it("continues for a listed user", async () => {
      accessManager.allowedUsersMap.set(1, { id: 1, userName: "visitor" });
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });

      await middleware(ctx, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(reply).not.toHaveBeenCalled();
    });

    it("continues for an unlisted user in an allowed group", async () => {
      accessManager.allowedGroupsMap.set(-100, {
        id: -100,
        title: "Test group",
      });
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });

      await middleware(ctx, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(reply).not.toHaveBeenCalled();
    });
  });
  describe("denied commands", () => {
    it("replies once to a command and stops processing", async () => {
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).toHaveBeenCalledTimes(1);
      expect(reply).toHaveBeenCalledWith(
        "Sorry, you don't have permission to use this bot.",
      );
    });

    it("also rejects a command addressed to the bot by username", async () => {
      const { ctx, next, reply } = makeContext({
        text: "/chat@test_bot hello",
      });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).toHaveBeenCalledTimes(1);
      expect(reply).toHaveBeenCalledWith(
        "Sorry, you don't have permission to use this bot.",
      );
    });

    it("replies to a command in a photo caption", async () => {
      const { ctx, next, reply } = makeContext({
        photo: [],
        caption: "/chat describe this",
      });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).toHaveBeenCalledTimes(1);
      expect(reply).toHaveBeenCalledWith(
        "Sorry, you don't have permission to use this bot.",
      );
    });
  });
  describe("silently ignored messages", () => {
    it("ignores chat! from a user without access", async () => {
      const { ctx, next, reply } = makeContext({ text: "chat! hello" });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores a reply to the bot from a user without access", async () => {
      const { ctx, next, reply } = makeContext({
        text: "hello",
        reply_to_message: { from: { id: 99 } },
      });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores a question from a user without access", async () => {
      const { ctx, next, reply } = makeContext({ text: "hello?" });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores ordinary text from a user without access", async () => {
      const { ctx, next, reply } = makeContext({ text: "hello" });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores a photo with an ordinary caption", async () => {
      const { ctx, next, reply } = makeContext({ photo: [], caption: "hello" });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores a photo without a caption", async () => {
      const { ctx, next, reply } = makeContext({ photo: [] });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("ignores a sticker", async () => {
      const { ctx, next, reply } = makeContext({ sticker: {} });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });
  });
  describe("missing message context", () => {
    it("stops without from even if the admin check would pass", async () => {
      isAdminUser.mockReturnValue(true);
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });
      Object.defineProperty(ctx, "from", { value: undefined });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });

    it("stops without chat even if the admin check would pass", async () => {
      isAdminUser.mockReturnValue(true);
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });
      Object.defineProperty(ctx, "chat", { value: undefined });

      await middleware(ctx, next);

      expect(next).not.toHaveBeenCalled();
      expect(reply).not.toHaveBeenCalled();
    });
  });
  describe("sending the denial response", () => {
    it("waits for the denial reply before completing", async () => {
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });
      let finishReply!: () => void;
      reply.mockReturnValue(
        new Promise<void>((resolve) => {
          finishReply = resolve;
        }),
      );
      let completed = false;
      const handling = Promise.resolve(middleware(ctx, next)).then(() => {
        completed = true;
      });
      await Promise.resolve();
      expect(reply).toHaveBeenCalledTimes(1);
      expect(completed).toBe(false);
      finishReply();
      await handling;
      expect(completed).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });

    it("handles a failed denial reply without continuing or exposing the error", async () => {
      const { ctx, next, reply } = makeContext({ text: "/chat hello" });
      const error = new Error("API error containing secret credentials");
      reply.mockRejectedValue(error);
      const logError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(middleware(ctx, next)).resolves.toBeUndefined();
      expect(next).not.toHaveBeenCalled();
      expect(reply).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(logError.mock.calls)).not.toContain(error.message);
    });
  });
});
