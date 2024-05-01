import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.command("chat", async (ctx) => {
  const message = ctx.prompt.text;

  if (!message) {
    ctx.reply("Please provide a message to chat about.");
    return;
  }

  try {
    const content = await openAi.getChatCompletions(message);
    ctx.reply(content);
  } catch (error: any) {
    console.error("ERROR:", error);
    let errorMessage = "Sorry, there was an error processing your request.";
    if (
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.message
    ) {
      errorMessage += ` Error: ${error.response.data.error.message}`;
    }
    ctx.reply(errorMessage);
  }
});
