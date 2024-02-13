import { bot } from "../bot";
import { openAi } from "../../openai/openai";

bot.command("draw", async (ctx) => {
  const userPrompt = ctx.prompt?.text;
  if (!userPrompt) {
    return ctx.reply("Please provide a prompt for the drawing.");
  }
  try {
    let response = await openAi.draw(userPrompt);
    if (response.data && response.data.data.length > 0) {
      const imageUrl = response.data.data[0].url; // URL of the generated image
      ctx.replyWithPhoto(imageUrl).then((message) => {
        const messageId = message.message_id;
        openAi.addImageHistory(messageId, imageUrl, userPrompt); // Store the image URL with the message ID
      }); // Send the image back to the user
    } else {
      ctx.reply("Sorry, I could not generate an image for that prompt.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    ctx.reply("An error occurred while generating your image.");
  }
});
