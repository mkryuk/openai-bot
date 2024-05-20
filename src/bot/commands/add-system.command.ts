import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// add new system message to system messages
bot.command("add_system", isAdminUser, (ctx) => {
  const message = ctx.prompt.text;
  openAi.addSystemMessage(message);
  ctx.reply(`system message added`);
});
