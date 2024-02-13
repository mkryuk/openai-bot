import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set current model
bot.command("set_model", (ctx) => {
  const commandName = "/set_model ";
  openAi.modelName = ctx.message.text.slice(commandName.length);
  ctx.reply(`model changed to ${openAi.modelName}`);
});
