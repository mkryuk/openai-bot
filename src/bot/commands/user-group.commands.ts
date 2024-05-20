import { bot } from "../bot";
import { accessManager } from "../access-manager";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// Command to add a user
bot.command("add_user", isAdminUser, (ctx) => {
  const [command, userId, userName] = ctx.message.text.split(" ");
  const id = parseInt(userId, 10);

  if (!id || !userName) {
    return ctx.reply("Usage: /add_user <userId> <userName>");
  }

  accessManager.addUser(id, userName);
  ctx.reply(`User ${userName} added.`);
});

// Command to delete a user
bot.command("delete_user", isAdminUser, (ctx) => {
  const [command, userId] = ctx.message.text.split(" ");
  const id = parseInt(userId, 10);

  if (!id) {
    return ctx.reply("Usage: /delete_user <userId>");
  }

  accessManager.deleteUser(id);
  ctx.reply("User removed.");
});

// Command to add a group
bot.command("add_group", isAdminUser, (ctx) => {
  const [command, groupId, ...titleParts] = ctx.message.text.split(" ");
  const id = parseInt(groupId, 10);
  const title = titleParts.join(" ");

  if (!id || !title) {
    return ctx.reply("Usage: /add_group <groupId> <title>");
  }

  accessManager.addGroup(id, title);
  ctx.reply(`Group "${title}" added.`);
});

// Command to delete a group
bot.command("delete_group", isAdminUser, (ctx) => {
  const [command, groupId] = ctx.message.text.split(" ");
  const id = parseInt(groupId, 10);

  if (!id) {
    return ctx.reply("Usage: /delete_group <groupId>");
  }

  accessManager.deleteGroup(id);
  ctx.reply("Group removed.");
});
