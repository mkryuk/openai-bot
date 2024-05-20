import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// set current model's depth
bot.command("set_depth", isAdminUser, (ctx) => {
  openAi.messageDepth = parseInt(ctx.prompt.text || "10", 10);
  ctx.reply(`message depth changed to ${openAi.messageDepth}`);
});
