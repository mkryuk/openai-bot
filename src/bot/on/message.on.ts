import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// Listen to all incoming messages
bot.on("message", async (ctx: any) => {
  const { message } = ctx;
  const replyToMessage = message.reply_to_message;
  // Handle replies to the bot's messages
  if (replyToMessage && replyToMessage.from.id === ctx.botInfo.id) {
    if (openAi.hasImageHistory(replyToMessage.message_id)) {
      if (message.text === "variant") {
        await handleImageVariation(replyToMessage.message_id, ctx);
      } else {
        await redrawImage(replyToMessage.message_id, message.text, ctx);
      }
    } else {
      await handleChatCompletions(message.text, ctx);
    }
  }
  // Handle messages ending with a question mark
  else if (message.text.endsWith("?") && openAi.shouldReply()) {
    await handleChatCompletions(message.text, ctx);
  }
});

async function handleImageVariation(replyToMessageId: number, ctx: any) {
  try {
    const response = await openAi.drawVariations(replyToMessageId);
    const { prompt } = openAi.imageHistory.get(replyToMessageId)!;
    if (response.data && response.data.data.length > 0) {
      const variationImageUrl = response.data.data[0].url;
      const message = await ctx.replyWithPhoto(variationImageUrl);
      openAi.addImageHistory(message.message_id, variationImageUrl, prompt); // Store new image URL with message ID
    } else {
      ctx.reply("Sorry, I could not generate a variation for that image.");
    }
  } catch (error) {
    console.error("Error generating image variation:", error);
    ctx.reply("An error occurred while generating your image variation.");
  }
}

async function redrawImage(replyToMessageId: number, prompt: string, ctx: any) {
  try {
    const { prompt: prevPrompt } = openAi.imageHistory.get(replyToMessageId)!;
    const userPrompt = `${prevPrompt}; ${prompt}`;
    let response = await openAi.draw(userPrompt);
    if (response.data && response.data.data.length > 0) {
      const imageUrl = response.data.data[0].url; // URL of the generated image
      ctx.replyWithPhoto(imageUrl).then((message: any) => {
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
}

async function handleChatCompletions(messageText: string, ctx: any) {
  try {
    const response = await openAi.getChatCompletions(messageText);
    const content = response.data.choices[0].message.content;
    openAi.addMessage(content, "assistant");
    ctx.reply(content, { reply_to_message_id: ctx.message.message_id });
  } catch (error) {
    console.error("ERROR:", error);
  }
}
