import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// reset all messages
bot.command("reset", isAdminUser, (ctx) => {
  openAi.resetMessageQueue();
  console.log(`messageQueue set to []`);
  ctx.reply("messages empty");
});
