import { adminKeyboard } from "../keyboards/adminKeyboard.ts";
import { MyContext } from "../types.ts";
import { InlineKeyboard } from "grammy";

export const admin = async (ctx: MyContext) => {
  const ADMINS = [5370588246, 7244995341, 2093756924, 1643505035];
  const id = ctx.from?.id;

  console.log("Admin command triggered by:", id);

  if (!ADMINS.includes(id)) {
    await ctx.reply("⛔ Siz admin emassiz.");
    return;
  }

  await ctx.reply("👮‍♂️ Admin panelga xush kelibsiz!", {
    reply_markup: adminKeyboard,
  });
};
