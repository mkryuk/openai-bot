import { Context } from "telegraf"; // Import Context for typing ctx
import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.command("get_models", async (ctx: Context) => {
  try {
    const response = await openAi.getModelsList();
    const modelIds = response.data.data.map(
      (model: { id: string }) => model.id,
    );
    ctx.reply(modelIds.sort().join("\n"));
  } catch (error) {
    console.error("ERROR:", error);
    // Inform the user that an error occurred
    ctx.reply("Sorry, I couldn't fetch the model list at the moment.");
  }
});
