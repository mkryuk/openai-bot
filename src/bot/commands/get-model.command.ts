import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get current model we are working with
bot.command("get_model", (ctx) => {
  ctx.reply(`current model: ${openAi.modelName}`);
});
