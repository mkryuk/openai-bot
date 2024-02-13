import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// get all models that available now
bot.command("get_models", (ctx) => {
  openAi
    .getModelsList()
    .then(function (response) {
      const modelIds: string[] = response.data.data.map(
        (model: any) => model.id,
      );
      ctx.reply(modelIds.sort().join("\n"));
    })
    .catch(function (error) {
      console.error("ERROR:", error);
    });
});
