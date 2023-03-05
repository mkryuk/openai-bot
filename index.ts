import { Telegraf } from "telegraf";
import * as request from "request";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_TOKEN ?? "";
const openai_token = process.env.OPENAI_TOKEN;
const bot = new Telegraf(token);
let max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
let temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.5");
let model_name = process.env.OPENAI_MODEL_NAME;

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
  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_token,
    },
    json: {
      model: model_name,
      messages: [{ role: "user", content: message }],
      max_tokens: max_tokens,
      temperature: temperature,
    },
  };

  console.log(`${ctx.from.username}:${message}`);

  request.post(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      ctx.reply(body.choices[0].message.content);
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

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
