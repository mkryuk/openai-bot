import { bot } from "../bot";
import { openAi } from "../../openai/openai";

// Listen to all incoming messages and keep track of the last message_depth messages
bot.on("message", (ctx: any) => {
  const message = ctx.message.text;
  // Check if the message is a reply to one of the bot's messages
  if (
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from.id === ctx.botInfo.id
  ) {
    if (
      openAi.hasImageHistory(ctx.message.reply_to_message.message_id) &&
      message === "redraw"
    ) {
      openAi
        .drawVariations(ctx.message.reply_to_message.message_id)
        .then((response) => {
          if (response.data && response.data.data.length > 0) {
            const variationImageUrl = response.data.data[0].url;
            ctx.replyWithPhoto(variationImageUrl).then((message: any) => {
              const messageId = message.message_id;
              openAi.addImageHistory(messageId, variationImageUrl); // Store the image URL with the message ID
            }); // Send the image back to the user
          } else {
            ctx.reply(
              "Sorry, I could not generate a variation for that image.",
            );
          }
        })
        .catch((error) => {
          console.error("Error generating image variation:", error);
          ctx.reply("An error occurred while generating your image variation.");
        });
    } else {
      // Then you can call the OpenAI API
      openAi
        .getChatCompletions(ctx.message.text)
        .then((response) => {
          const content = response.data.choices[0].message.content;
          openAi.addMessage(content, "assistant");
          ctx.reply(content, { reply_to_message_id: ctx.message.message_id });
        })
        .catch((error) => {
          console.error("ERROR:", error);
        });
    }
  }

  // Check if the message ends with a question mark
  else if (ctx.message.text.endsWith("?") && openAi.shouldReply()) {
    openAi
      .getChatCompletions(message)
      .then(function (response) {
        const content = response.data.choices[0].message.content;
        openAi.addMessage(content, "assistant");
        ctx.reply(content, { reply_to_message_id: ctx.message.message_id });
      })
      .catch(function (error) {
        console.error("ERROR:", error);
      });
  }
});
