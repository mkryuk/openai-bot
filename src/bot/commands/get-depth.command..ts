import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get current model's depth we are working with
bot.command("get_depth", (ctx) => {
  ctx.reply(`message depth is ${openAi.messageDepth}`);
});
