import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set model's temperature
bot.command("set_temperature", (ctx) => {
  const commandName = "/set_temperature ";
  openAi.temperature = parseFloat(
    ctx.message.text.slice(commandName.length) || "0.5"
  );
  ctx.reply(`temperature changed to ${openAi.temperature}`);
});
