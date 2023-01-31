import { Telegraf } from "telegraf";
import * as request from "request";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_TOKEN ?? "";
const openai_token = process.env.OPENAI_TOKEN;
const max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1024", 10);
const temperature = parseInt(process.env.OPENAI_TEMPERATURE ?? "0.5");
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
      model: "text-davinci-003",
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

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
