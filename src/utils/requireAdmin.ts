// utils/requireAdmin.ts
import { MyContext } from "../types.js";

const ADMINS = [5370588246, 7244995341, 2093756924, 1643505035];

export function requireAdmin(handler: (ctx: MyContext) => Promise<unknown>) {
  return async (ctx: MyContext) => {
    const id = ctx.from?.id;
    if (!id || !ADMINS.includes(id)) {
      await ctx.answerCallbackQuery?.({
        text: "⛔ Bu bo‘limga faqat adminlar kira oladi.",
        show_alert: true,
      }).catch(() => ctx.reply("⛔ Siz admin emassiz."));
      return;
    }

    return handler(ctx);
  };
}
