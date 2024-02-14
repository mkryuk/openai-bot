import { Context, Telegraf } from "telegraf";

// Telegram
const telegram_token = process.env.TELEGRAM_TOKEN ?? "";

export interface OaiContext extends Context {
  prompt: {
    raw: string;
    command: string;
    text: string;
  };
}
export const bot = new Telegraf<OaiContext>(telegram_token);
