import { Context, Middleware } from "telegraf";
import { accessManager } from "../access-manager";

interface RateLimitOptions {
  limit: number;
  resetInterval: number; // in milliseconds
}

export const createRateLimitMiddleware = (
  options: RateLimitOptions,
): Middleware<Context> => {
  const { limit, resetInterval } = options;
  const usageRecords = new Map<number, { count: number; resetTime: number }>();

  return async (ctx, next) => {
    const key = ctx.chat?.id; // Use chat ID as key to track both private and group chats
    if (key === undefined || !ctx.from) {
      return; // Skip if chat ID is not available
    }

    const now = Date.now();
    const record = usageRecords.get(key);

    // Reset count if the reset interval has passed
    if (record && now > record.resetTime) {
      usageRecords.set(key, { count: 1, resetTime: now + resetInterval });
    } else if (
      !accessManager.isAdminUser(ctx.from.id) &&
      record &&
      record.count >= limit
    ) {
      // Limit reached, do not proceed to the next middleware (i.e., the command handler)
      return ctx.reply(
        `You've reached the limit of ${limit} uses per day for this command.`,
      );
    } else {
      // Increment the count or set initial value if record does not exist
      const newCount = record ? record.count + 1 : 1;
      usageRecords.set(key, {
        count: newCount,
        resetTime: record ? record.resetTime : now + resetInterval,
      });
    }

    return next();
  };
};
