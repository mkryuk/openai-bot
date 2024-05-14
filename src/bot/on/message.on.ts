import { bot } from "../bot";
import { openAi } from "../../openai/openai";
import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";

// Listen to all incoming messages
bot.on("message", async (ctx) => {
  const { message } = ctx;

  if (isPhotoMessageWithCaption(message)) {
    await processImageView(ctx);
  } else if (isTextMessage(message)) {
    await processTextMessage(ctx);
  }
});

function isPhotoMessageWithCaption(
  message: Message,
): message is Message.PhotoMessage {
  return (
    "photo" in message &&
    "caption" in message &&
    message.caption !== undefined &&
    message.caption.startsWith("/chat")
  );
}

async function processImageView(ctx: Context) {
  const { caption, photo } = ctx.message as Message.PhotoMessage;
  if (!caption) {
    return;
  }

  const text = caption.slice("/chat".length).trim();
  const fileId = photo[photo.length - 1].file_id; // Get highest resolution photo

  try {
    const fileUrl = (await ctx.telegram.getFileLink(fileId)).toString();
    await handleImageVision(fileUrl, text, ctx);
  } catch (error) {
    console.error("Error fetching file URL: ", error);
    await ctx.reply("There was an error processing the image.");
  }
}

function isTextMessage(message: Message): message is Message.TextMessage {
  return "text" in message;
}

async function processTextMessage(ctx: Context) {
  const { text: message, reply_to_message: replyToMessage } =
    ctx.message as Message.TextMessage;

  if (replyToMessage && isReplyToBotMessage(replyToMessage, ctx.botInfo.id)) {
    if (openAi.hasImageHistory(replyToMessage.message_id)) {
      await handleImageReply(message, replyToMessage.message_id, ctx);
    } else {
      await handleChatCompletions(message, ctx);
    }
  } else if (message.endsWith("?") && openAi.shouldReply()) {
    await handleChatCompletions(message, ctx);
  }
}

function isReplyToBotMessage(replyToMessage: Message, botId: number): boolean {
  return replyToMessage?.from?.id === botId;
}

async function handleImageReply(
  message: string,
  replyToMessageId: number,
  ctx: Context,
) {
  try {
    const { imageUrl } = openAi.getImageHistory(replyToMessageId);
    await handleImageVision(imageUrl, message, ctx);
  } catch (error) {
    console.error("Error handling image reply:", error);
    await ctx.reply("There was an error processing the image reply.");
  }
}

async function handleChatCompletions(messageText: string, ctx: Context) {
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

async function handleImageVision(imageUrl: string, text: string, ctx: Context) {
  try {
    const result = await openAi.handleImageVision(imageUrl, text);
    ctx.reply(result);
  } catch (error) {
    console.error("Error processing image:", error);
    ctx.reply("An error occurred while processing your image.");
  }
}
