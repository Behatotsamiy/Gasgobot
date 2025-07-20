import { adminKeyboard } from "../../keyboards/inline/adminKeyboard.ts";
import { MyContext } from "../../types.js";

export const admin = async (ctx: MyContext) => {
  await ctx.reply("👮‍♂️ Admin panelga xush kelibsiz!", {
    reply_markup: adminKeyboard,
  });
};
