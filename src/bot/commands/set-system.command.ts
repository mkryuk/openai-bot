import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set system messages to be used
bot.command("set_system", (ctx) => {
  const commandName = "/set_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.setSystemMessage(message);
  ctx.reply(`system message set`);
});
