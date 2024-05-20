import { Context, Middleware } from "telegraf";
import { accessManager } from "../access-manager";

// Middleware to check if the user is an admin

export const isAdminUser: Middleware<Context> = (ctx, next) => {
  if (!ctx.from || !accessManager.isAdminUser(ctx.from.id)) {
    return ctx.reply("You're not authorized to use this command.");
  }
  return next();
};
