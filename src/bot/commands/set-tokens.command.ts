import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set amount of tokens to be used
bot.command("set_tokens", (ctx) => {
  openAi.maxTokens = parseInt(ctx.prompt.text || "1024", 10);
  ctx.reply(`tokens changed to ${openAi.maxTokens}`);
});
