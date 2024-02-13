import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get current tokens amount
bot.command("get_tokens", (ctx) => {
  ctx.reply(`current tokens: ${openAi.maxTokens}`);
});
