import { Telegraf } from "telegraf";

// Telegram
const telegram_token = process.env.TELEGRAM_TOKEN ?? "";
export const bot = new Telegraf(telegram_token);
