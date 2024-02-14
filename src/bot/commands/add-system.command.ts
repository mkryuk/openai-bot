import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// add new system message to system messages
bot.command("add_system", (ctx) => {
  const message = ctx.prompt.text;
  openAi.addSystemMessage(message);
  ctx.reply(`system message added`);
});
