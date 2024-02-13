import dotenv from "dotenv";
dotenv.config();
import { bot } from "./bot";
import { openAi } from "./openai/openai";
import "./commands";

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

bot.command("draw", async (ctx) => {
  // Extract user prompt from the command
  const [_, userPrompt] = ctx.message.text.split("/draw ");
  if (!userPrompt) {
    return ctx.reply("Please provide a prompt for the drawing.");
  }
  try {
    let response = await openAi.draw(userPrompt);
    if (response.data && response.data.data.length > 0) {
      const imageUrl = response.data.data[0].url; // URL of the generated image
      ctx.replyWithPhoto(imageUrl).then((message) => {
        const messageId = message.message_id;
        openAi.addImageHistory(messageId, imageUrl); // Store the image URL with the message ID
      }); // Send the image back to the user
    } else {
      ctx.reply("Sorry, I could not generate an image for that prompt.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    ctx.reply("An error occurred while generating your image.");
  }
});

bot.hears(/^chat!/, async (ctx) => {
  const commandName = "chat! ";
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
    });
});

// Listen to all incoming messages and keep track of the last message_depth messages
bot.on("message", (ctx: any) => {
  // Check if the message is a reply to one of the bot's messages
  if (
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from.id === ctx.botInfo.id
  ) {
    if (openAi.hasImageHistory(ctx.message.reply_to_message.message_id)) {
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
    const message = ctx.message.text;
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

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
