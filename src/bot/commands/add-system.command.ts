import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// add new system message to system messages
bot.command("add_system", (ctx) => {
  const commandName = "/add_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.addSystemMessage(message);
  ctx.reply(`system message added`);
});
