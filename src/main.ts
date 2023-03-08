import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { OpenAi } from "./openai/openai";
dotenv.config();

// Telegram
const telegram_token = process.env.TELEGRAM_TOKEN ?? "";
const bot = new Telegraf(telegram_token);

// OpenAI
const openAi_token = process.env.OPENAI_TOKEN ?? "";
const max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.5");
const model_name = process.env.OPENAI_MODEL_NAME ?? "gpt-3.5-turbo";
const openAi = new OpenAi(openAi_token, max_tokens, temperature, model_name);

bot.command("openai", (ctx) => {
  const commandName = "/openai ";
  const prompt = ctx.message.text.slice(commandName.length);
  openAi
    .getTextCompletions(prompt)
    .then(function (response) {
      ctx.reply(response.data.choices[0].text);
    })
    .catch(function (error) {
      console.error("ERROR:", error);
    });
});

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
    });
});

bot.command("models", (ctx) => {
  openAi
    .getModelsList()
    .then(function (response) {
      const modelIds: string[] = response.data.data.map(
        (model: any) => model.id,
      );
      ctx.reply(modelIds.sort().join("\n"));
    })
    .catch(function (error) {
      console.error("ERROR:", error);
    });
});

bot.command("get_model", (ctx) => {
  ctx.reply(`current model: ${openAi.modelName}`);
});

bot.command("get_tokens", (ctx) => {
  ctx.reply(`current tokens: ${openAi.maxTokens}`);
});

bot.command("get_temperature", (ctx) => {
  ctx.reply(`current temperature: ${openAi.temperature}`);
});

bot.command("get_depth", (ctx) => {
  ctx.reply(`message depth is ${openAi.messageDepth}`);
});

bot.command("set_model", (ctx) => {
  const commandName = "/set_model ";
  openAi.modelName = ctx.message.text.slice(commandName.length);
  ctx.reply(`model changed to ${openAi.modelName}`);
});

bot.command("set_tokens", (ctx) => {
  const commandName = "/set_tokens ";
  openAi.maxTokens = parseInt(
    ctx.message.text.slice(commandName.length) || "1024",
    10,
  );
  ctx.reply(`tokens changed to ${openAi.maxTokens}`);
});

bot.command("set_temperature", (ctx) => {
  const commandName = "/set_temperature ";
  openAi.temperature = parseFloat(
    ctx.message.text.slice(commandName.length) || "0.5",
  );
  ctx.reply(`temperature changed to ${openAi.temperature}`);
});

bot.command("set_system", (ctx) => {
  const commandName = "/set_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.setSystemMessage(message);
  ctx.reply(`system message set`);
});

bot.command("add_system", (ctx) => {
  const commandName = "/add_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.addSystemMessage(message);
  ctx.reply(`system message set`);
});

bot.command("set_depth", (ctx) => {
  const commandName = "/set_depth ";
  openAi.messageDepth = parseInt(
    ctx.message.text.slice(commandName.length) || "10",
    10,
  );
  ctx.reply(`message depth changed to ${openAi.messageDepth}`);
});

bot.command("reset", (ctx) => {
  openAi.resetMessageQueue();
  console.log(`messageQueue set to []`);
  ctx.reply("messages empty");
});

bot.hears(/^!say/, async (ctx) => {
  const message = ctx.message.text;
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
  openAi.addMessage(
    ctx.message.text,
    ctx.message.from.id !== ctx.botInfo.id ? "user" : "assistant",
  );
});

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
