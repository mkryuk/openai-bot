import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set system messages to be used
bot.command("set_system", (ctx) => {
  const message = ctx.prompt.text;
  openAi.setSystemMessage(message);
  ctx.reply(`system message set`);
});
