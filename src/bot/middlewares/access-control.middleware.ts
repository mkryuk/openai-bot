import { bot } from "../bot";
import { accessManager } from "../access-manager";

bot.use((ctx, next) => {
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

  // Skip for non-command messages
  if (
    ctx.updateType === "message" &&
    ctx.message &&
    "text" in ctx.message &&
    !ctx.message.text.startsWith("/")
  ) {
    return next();
  }

  // Check if the user or chat ID is in the allowed list
  if (
    accessManager.isAdminUser(userId) ||
    accessManager.allowedUsersMap.has(userId) ||
    accessManager.allowedGroupsMap.has(chatId)
  ) {
    return next(); // User is allowed, proceed with handling the command
  } else {
    // Optional: Send a message if the user is not allowed
    ctx.reply("Sorry, you don't have permission to use this bot.");
    console.log(
      `Access denied for user: ${userName} id: ${userId}, chat: ${chatId}`,
    );
    return; // Stop processing the command
  }
});
