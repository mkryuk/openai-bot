import dotenv from "dotenv";
dotenv.config();
import { bot } from "./bot/bot";
import { openAi } from "./openai/openai";
import "./bot/middlewares";
import "./bot/commands";
import "./bot/hears";
import "./bot/on";
import "./bot/schedules";
import { initializeSystemMessagesFromConfig } from "./openai/system-message-init";

const configPath = process.env.CONFIG_PATH || "config.json";
initializeSystemMessagesFromConfig(configPath, openAi);

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
