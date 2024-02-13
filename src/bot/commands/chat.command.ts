import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.command("chat", async (ctx) => {
  // Telegraf automatically strips the command and gives you the text that follows
  const message = ctx.message.text.split(" ").slice(1).join(" ");

  if (!message) {
    ctx.reply("Please provide a message to chat about.");
    return;
  }

  try {
    const response = await openAi.getChatCompletions(message);
    const content = response.data.choices[0].message.content;
    openAi.addMessage(content, "assistant");

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
