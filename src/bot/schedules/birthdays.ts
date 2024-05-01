import fs from "fs";
import schedule from "node-schedule";
import { openAi } from "../../openai/openai";
import { bot } from "../bot";

// Function to load birthdays from a JSON file
function loadData() {
  try {
    const data = fs.readFileSync(
      process.env.BIRTHDAYS_CONFIG_PATH ?? "",
      "utf8",
    );
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
  }
}

// Schedule the birthday check
schedule.scheduleJob(
  process.env.BIRTHDAYS_SCHEDULE ?? "0 11 * * *",
  async () => {
    const data = loadData();
    const today = new Date().toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    });

    for (let { name, date } of data.members) {
      if (date === today) {
        console.log(`Preparing message for ${name} (${date})`);
        try {
          const message = data.messageTemplate.replace(/{name}/g, name);
          const content = await openAi.getChatCompletions(message);
          await bot.telegram.sendMessage(data.chatId, content);
        } catch (error) {
          console.error(`Failed to send message for ${name}:`, error);
        }
      }
    }
  },
);
