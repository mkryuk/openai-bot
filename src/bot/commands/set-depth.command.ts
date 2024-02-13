import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set current model's depth
bot.command("set_depth", (ctx) => {
  const commandName = "/set_depth ";
  openAi.messageDepth = parseInt(
    ctx.message.text.slice(commandName.length) || "10",
    10,
  );
  ctx.reply(`message depth changed to ${openAi.messageDepth}`);
});
