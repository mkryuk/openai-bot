import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set current model's depth
bot.command("set_depth", (ctx) => {
  openAi.messageDepth = parseInt(ctx.prompt.text || "10", 10);
  ctx.reply(`message depth changed to ${openAi.messageDepth}`);
});
