import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// set system messages to be used
bot.command("set_system", isAdminUser, (ctx) => {
  const message = ctx.prompt.text;
  openAi.setSystemMessage(message);
  ctx.reply(`system message set`);
});
