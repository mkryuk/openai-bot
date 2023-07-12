import dotenv from "dotenv";
dotenv.config();
import { bot } from "./bot";
import { openAi } from "./openai/openai";
import { setCommands } from "./commands";

setCommands();

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

  // Check if the message ends with a question mark
  else if (ctx.message.text.endsWith("?")) {
    if (openAi.shouldReply()) {
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
