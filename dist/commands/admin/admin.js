import { adminKeyboard } from "../../keyboards/inline/adminKeyboard.js";
export const admin = async (ctx) => {
    await ctx.reply("👮‍♂️ Admin panelga xush kelibsiz!", {
        reply_markup: adminKeyboard,
    });
};
