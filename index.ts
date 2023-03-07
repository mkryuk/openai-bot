import { Telegraf } from "telegraf";
import * as request from "request";
import dotenv from "dotenv";
dotenv.config();

const telegram_token = process.env.TELEGRAM_TOKEN ?? "";
const openai_token = process.env.OPENAI_TOKEN;
const bot = new Telegraf(telegram_token);
type Message = { role: string; content: string };
let systemMessages: Message[] = [];

// Keep track of the last message_depth messages in the chat
let message_depth = 10;
let messageQueue: Message[] = [];

let max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
let temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.5");
let model_name = process.env.OPENAI_MODEL_NAME ?? "gpt-3.5-turbo";

bot.command("openai", (ctx) => {
  const commandName = "/openai ";
  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_token,
    },
    json: {
      model: model_name,
      prompt: ctx.message.text.slice(commandName.length),
      max_tokens: max_tokens,
      temperature: temperature,
    },
  };

  console.log(`${ctx.from.username}:${commandName.length}`);

  request.post(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      ctx.reply(body.choices[0].text);
    }
  });
});

bot.command("chat", (ctx) => {
  const commandName = "/chat ";
  const message = ctx.message.text.slice(commandName.length);
  addMessage(message, "user");
  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_token,
    },
    json: {
      model: model_name,
      messages: [...systemMessages, ...messageQueue],
      max_tokens: max_tokens,
      temperature: temperature,
    },
  };

  console.log(`${ctx.from.username}:${messageQueue.length}`);
  request.post(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      const content = body.choices[0].message.content;
      ctx.reply(content);
      addMessage(content, "assistant");
    }
  });
});

bot.command("models", (ctx) => {
  const options = {
    method: "GET",
    url: "https://api.openai.com/v1/models",
    headers: {
      Authorization: "Bearer " + openai_token,
    },
    json: true,
  };

  console.log(`models:list ${ctx.from.username}`);

  request.get(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      const modelIds: string[] = body.data.map((model: any) => model.id);
      ctx.reply(modelIds.sort().join("\n"));
    }
  });
});

bot.command("get_model", (ctx) => {
  ctx.reply(`current model: ${model_name}`);
});

bot.command("get_tokens", (ctx) => {
  ctx.reply(`current tokens: ${max_tokens}`);
});

bot.command("get_temperature", (ctx) => {
  ctx.reply(`current temperature: ${temperature}`);
});

bot.command("get_depth", (ctx) => {
  ctx.reply(`message depth is ${message_depth}`);
});

bot.command("set_model", (ctx) => {
  const commandName = "/set_model ";
  model_name = ctx.message.text.slice(commandName.length);
  ctx.reply(`model changed to ${model_name}`);
});

bot.command("set_tokens", (ctx) => {
  const commandName = "/set_tokens ";
  max_tokens = parseInt(
    ctx.message.text.slice(commandName.length) || "1024",
    10,
  );
  ctx.reply(`tokens changed to ${max_tokens}`);
});

bot.command("set_temperature", (ctx) => {
  const commandName = "/set_temperature ";
  temperature = parseFloat(ctx.message.text.slice(commandName.length) || "0.5");
  ctx.reply(`temperature changed to ${temperature}`);
});

bot.command("set_system", (ctx) => {
  const commandName = "/set_system ";
  const message = ctx.message.text.slice(commandName.length);
  systemMessages = [{ role: "system", content: message }];
  ctx.reply(`system message set`);
});

bot.command("add_system", (ctx) => {
  const commandName = "/add_system ";
  const message = ctx.message.text.slice(commandName.length);
  systemMessages.push({ role: "system", content: message });
  ctx.reply(`system message set`);
});

bot.command("set_depth", (ctx) => {
  const commandName = "/set_depth ";
  message_depth = parseInt(
    ctx.message.text.slice(commandName.length) || "10",
    10,
  );
  ctx.reply(`message depth changed to ${message_depth}`);
});

bot.command("reset", (ctx) => {
  messageQueue = [];
  console.log(`messageQueue set to []`);
  ctx.reply("messages empty");
});

bot.hears(/^!say/, async (ctx) => {
  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_token,
    },
    json: {
      model: model_name,
      messages: [...systemMessages, ...messageQueue],
      max_tokens: max_tokens,
      temperature: temperature,
    },
  };

  request.post(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      const content = body.choices[0].message.content;
      addMessage(content, "assistant");
      ctx.reply(content);
    }
  });
});

// Listen to all incoming messages and keep track of the last message_depth messages
bot.on("message", (ctx: any) => {
  addMessage(
    ctx.message.text,
    ctx.message.from.id !== ctx.botInfo.id ? "user" : "assistant",
  );
});

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

function addMessage(content: string, role: "user" | "assistant") {
  const message = {
    role: role,
    content: content,
  };
  messageQueue.push(message);
  while (messageQueue.length > message_depth) {
    messageQueue.shift();
  }
}

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
