import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set reply probability
bot.command("set_reply_probability", (ctx) => {
  const commandName = "/set_reply_probability ";
  openAi.replyProbability = parseFloat(
    ctx.message.text.slice(commandName.length) || "10",
  );
  ctx.reply(`reply probability changed to ${openAi.replyProbability}%`);
});
