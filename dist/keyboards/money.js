import { InlineKeyboard } from "grammy";
export const moneyKeyboard = async (ctx) => {
    await ctx.answerCallbackQuery();
    const keyboard = new InlineKeyboard().text("Orqaga", "backToMenu");
    return ctx.reply("Yordamingizdan juda mamnunmiz ❤️\nKarta: 8600120450184331\nK.S.", { reply_markup: keyboard });
};
