import { bot } from "./bot";
import { openAi } from "./openai/openai";

// get all models that available now
bot.command("get_models", (ctx) => {
  openAi
    .getModelsList()
    .then(function (response) {
      const modelIds: string[] = response.data.data.map(
        (model: any) => model.id,
      );
      ctx.reply(modelIds.sort().join("\n"));
    })
    .catch(function (error) {
      console.error("ERROR:", error);
    });
});

// get current model we are working with
bot.command("get_model", (ctx) => {
  ctx.reply(`current model: ${openAi.modelName}`);
});

// set current model
bot.command("set_model", (ctx) => {
  const commandName = "/set_model ";
  openAi.modelName = ctx.message.text.slice(commandName.length);
  ctx.reply(`model changed to ${openAi.modelName}`);
});

// get current tokens amount
bot.command("get_tokens", (ctx) => {
  ctx.reply(`current tokens: ${openAi.maxTokens}`);
});

// set amount of tokens to be used
bot.command("set_tokens", (ctx) => {
  const commandName = "/set_tokens ";
  openAi.maxTokens = parseInt(
    ctx.message.text.slice(commandName.length) || "1024",
    10,
  );
  ctx.reply(`tokens changed to ${openAi.maxTokens}`);
});

// get model's temperature
bot.command("get_temperature", (ctx) => {
  ctx.reply(`current temperature: ${openAi.temperature}`);
});

// set model's temperature
bot.command("set_temperature", (ctx) => {
  const commandName = "/set_temperature ";
  openAi.temperature = parseFloat(
    ctx.message.text.slice(commandName.length) || "0.5",
  );
  ctx.reply(`temperature changed to ${openAi.temperature}`);
});

// get current model's depth we are working with
bot.command("get_depth", (ctx) => {
  ctx.reply(`message depth is ${openAi.messageDepth}`);
});

// set current model's depth
bot.command("set_depth", (ctx) => {
  const commandName = "/set_depth ";
  openAi.messageDepth = parseInt(
    ctx.message.text.slice(commandName.length) || "10",
    10,
  );
  ctx.reply(`message depth changed to ${openAi.messageDepth}`);
});

// get current model's depth we are working with
bot.command("get_reply_probability", (ctx) => {
  ctx.reply(`reply probability is ${openAi.replyProbability}%`);
});

// set reply probability
bot.command("set_reply_probability", (ctx) => {
  const commandName = "/set_reply_probability ";
  openAi.replyProbability = parseFloat(
    ctx.message.text.slice(commandName.length) || "10",
  );
  ctx.reply(`reply probability changed to ${openAi.replyProbability}%`);
});

// set system messages to be used
bot.command("set_system", (ctx) => {
  const commandName = "/set_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.setSystemMessage(message);
  ctx.reply(`system message set`);
});

// add new system message to system messages
bot.command("add_system", (ctx) => {
  const commandName = "/add_system ";
  const message = ctx.message.text.slice(commandName.length);
  openAi.addSystemMessage(message);
  ctx.reply(`system message added`);
});

// reset all messages
bot.command("reset", (ctx) => {
  openAi.resetMessageQueue();
  console.log(`messageQueue set to []`);
  ctx.reply("messages empty");
});
