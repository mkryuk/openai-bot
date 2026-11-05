import { bot } from "../bot";
import { accessManager } from "../access-manager";

bot.use(async (ctx, next) => {
  if (!ctx.from || !ctx.chat) {
    console.log(`From and Chat info required`);
    return;
  }
  const userId = ctx.from.id;
  const userName = ctx.from.username;
  const chatId = ctx.chat.id;
  const chatTitle = "title" in ctx.chat ? ctx.chat.title : "private";
  console.log(
    `Message from user: ${userName} id: ${userId}, chat: ${chatId}, title: ${chatTitle}`,
  );

  // Apply access control to every update, including non-command messages.
  if (
    accessManager.isAdminUser(userId) ||
    accessManager.allowedUsersMap.has(userId) ||
    accessManager.allowedGroupsMap.has(chatId)
  ) {
    return next();
  }

  console.log(
    `Access denied for user: ${userName} id: ${userId}, chat: ${chatId}`,
  );

  const message = ctx.message;
  const text =
    message &&
    ("text" in message
      ? message.text
      : "caption" in message
      ? message.caption
      : undefined);

  // Ignore ordinary messages silently in chats without access.
  if (!text?.startsWith("/")) {
    return;
  }

  try {
    await ctx.reply("Sorry, you don't have permission to use this bot.");
  } catch {
    // Do not log the full API error, which may contain credentials.
    console.error(
      `Failed to send access denial for user: ${userId}, chat: ${chatId}`,
    );
  }
});
