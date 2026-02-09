import { OpenAi } from "./openai";
import { loadBotConfig } from "../config/bot-config";

export function applyInitialSystemMessages(
  openAi: OpenAi,
  messages: string[],
): void {
  if (!messages || messages.length === 0) {
    return;
  }
  openAi.setSystemMessages(messages);
}

export function initializeSystemMessagesFromConfig(
  configPath: string,
  openAi: OpenAi,
): void {
  const config = loadBotConfig(configPath);
  applyInitialSystemMessages(openAi, config.systemMessages || []);
}
