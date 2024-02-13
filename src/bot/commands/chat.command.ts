import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.command("chat", (ctx) => {
  const commandName = "/chat ";
  const message = ctx.message.text.slice(commandName.length);
  openAi
    .getChatCompletions(message)
    .then(function (response) {
      const content = response.data.choices[0].message.content;
      openAi.addMessage(content, "assistant");
      ctx.reply(content);
    })
    .catch(function (error) {
      console.error("ERROR:", error);
      ctx.reply(`Sorry: ${error.response.data.error.message}`);
    });
});
