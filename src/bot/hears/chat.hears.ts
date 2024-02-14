import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.hears(/^chat!/, async (ctx) => {
  // Extract message text directly, assuming "chat!" is always the start
  const message = ctx.prompt.text;
  try {
    const response = await openAi.getChatCompletions(message);
    const content = response.data.choices[0].message.content;
    await openAi.addMessage(content, "assistant");
    await ctx.reply(content);
  } catch (error) {
    console.error("ERROR:", error);
    // Optionally, inform the user that an error occurred
    await ctx.reply("Sorry, there was an issue processing your request.");
  }
});
