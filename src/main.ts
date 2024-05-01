import dotenv from "dotenv";
dotenv.config();
import { bot } from "./bot/bot";
import "./bot/middlewares";
import "./bot/commands";
import "./bot/hears";
import "./bot/on";
import "./bot/schedules";

bot.launch().catch((reason) => {
  console.log("ERROR:", reason);
  process.exit(1);
});

console.log("STARTED");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
