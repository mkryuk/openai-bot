import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// set model's temperature
bot.command("set_temperature", (ctx) => {
  openAi.temperature = parseFloat(ctx.prompt.text || "0.5");
  ctx.reply(`temperature changed to ${openAi.temperature}`);
});
