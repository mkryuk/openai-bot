import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set current model
bot.command("set_model", (ctx) => {
  openAi.modelName = ctx.prompt.text;
  ctx.reply(`model changed to ${openAi.modelName}`);
});
