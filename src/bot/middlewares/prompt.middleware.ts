import { bot } from "../bot";

// Command arguments parsing middleware
bot.use((ctx, next) => {
  // Ensure ctx.update is of type Message before proceeding
  if (
    "message" in ctx.update &&
    ctx.update.message &&
    "text" in ctx.update.message
  ) {
    const text = ctx.update.message.text;
    const split = text.split(" ");
    const command = split.shift()?.toLowerCase();

    if (command) {
      ctx.prompt = {
        raw: text,
        command,
        text: split.join(" "),
      };
    }
  }
  return next();
});
