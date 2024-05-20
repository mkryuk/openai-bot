import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// set amount of tokens to be used
bot.command("set_tokens", isAdminUser, (ctx) => {
  openAi.maxTokens = parseInt(ctx.prompt.text || "1024", 10);
  ctx.reply(`tokens changed to ${openAi.maxTokens}`);
});
