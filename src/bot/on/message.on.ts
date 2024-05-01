import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { Context } from "telegraf";

// Listen to all incoming messages
bot.on("message", async (ctx) => {
  if (!ctx.message || !("text" in ctx.message)) {
    return;
  }
  const message = ctx.message.text;
  const replyToMessage = ctx.message.reply_to_message;
  // Check if the message text and reply_to_message exist
  if (ctx.message.reply_to_message) {
    if (replyToMessage && replyToMessage.from?.id === ctx.botInfo.id) {
      if (openAi.hasImageHistory(replyToMessage.message_id)) {
        // TODO: Add rate limiter for images redrawing
        message === "variant"
          ? await handleImageVariation(replyToMessage.message_id, ctx)
          : await redrawImage(replyToMessage.message_id, message, ctx);
      } else {
        await handleChatCompletions(message, ctx);
      }
    }
  } else if (message.endsWith("?") && openAi.shouldReply()) {
    await handleChatCompletions(ctx.message.text, ctx);
  }
});

async function handleImageVariation(replyToMessageId: number, ctx: Context) {
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

async function redrawImage(
  replyToMessageId: number,
  prompt: string,
  ctx: Context,
) {
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

async function handleChatCompletions(messageText: string, ctx: Context) {
  // Check if the message exists to prevent runtime errors
  if (!ctx.message) {
    console.error(
      "Attempted to handle chat completions without a message context.",
    );
    return;
  }

  try {
    const content = await openAi.getChatCompletions(messageText);
    if (!content) {
      console.error("Received empty content from openAi.getChatCompletions");
      await ctx.reply("I didn't get a response, please try again.");
      return;
    }
    await ctx.reply(content, { reply_to_message_id: ctx.message.message_id });
  } catch (error) {
    console.error("ERROR in handleChatCompletions:", error);
    await ctx.reply(
      "Sorry, I encountered an error while processing your request.",
    );
  }
}
