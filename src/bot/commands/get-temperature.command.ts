import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get model's temperature
bot.command("get_temperature", (ctx) => {
  ctx.reply(`current temperature: ${openAi.temperature}`);
});
