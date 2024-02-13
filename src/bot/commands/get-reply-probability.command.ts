import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get current model's depth we are working with
bot.command("get_reply_probability", (ctx) => {
  ctx.reply(`reply probability is ${openAi.replyProbability}%`);
});
