import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { isAdminUser } from "../middlewares/is-admin.middleware";

// set current model
bot.command("set_model", isAdminUser, (ctx) => {
  openAi.modelName = ctx.prompt.text;
  ctx.reply(`model changed to ${openAi.modelName}`);
});
