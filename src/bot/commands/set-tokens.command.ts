import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set amount of tokens to be used
bot.command("set_tokens", (ctx) => {
  const commandName = "/set_tokens ";
  openAi.maxTokens = parseInt(
    ctx.message.text.slice(commandName.length) || "1024",
    10,
  );
  ctx.reply(`tokens changed to ${openAi.maxTokens}`);
});
