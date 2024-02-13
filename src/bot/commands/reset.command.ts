import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// reset all messages
bot.command("reset", (ctx) => {
  openAi.resetMessageQueue();
  console.log(`messageQueue set to []`);
  ctx.reply("messages empty");
});
