import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// set reply probability
bot.command("set_reply_probability", isAdminUser, (ctx) => {
  openAi.replyProbability = parseFloat(ctx.prompt.text || "10");
  ctx.reply(`reply probability changed to ${openAi.replyProbability}%`);
});
