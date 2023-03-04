import { Telegraf } from "telegraf";
import * as request from "request";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_TOKEN ?? "";
const openai_token = process.env.OPENAI_TOKEN;
const max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseInt(process.env.OPENAI_TEMPERATURE ?? "0.5");
let model_name = process.env.OPENAI_MODEL_NAME;
const bot = new Telegraf(token);

bot.command("openai", (ctx) => {
  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_token,
    },
    json: {
      model: model_name,
      prompt: ctx.message.text.slice(8),
      max_tokens: max_tokens,
      temperature: temperature,
    },
  };

  console.log(`${ctx.from.username}:${ctx.message.text.slice(8)}`);

  request.post(options, (error: any, response: request.Response, body: any) => {
    if (body.error) {
      console.error("ERROR:", body.error.type, body.error.message);
    } else {
      ctx.reply(body.choices[0].text);
    }
  });
});

bot.command("chat", (ctx) => {
  const message = ctx.message.text.slice(6);
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

bot.command("use", (ctx) => {
  model_name = ctx.message.text.slice(5);
  ctx.reply(`model changed to ${model_name}`);
});

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
