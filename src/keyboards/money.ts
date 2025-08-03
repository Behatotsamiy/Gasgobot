import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.js";

export const moneyKeyboard = async (ctx: MyContext) => {
    await ctx.answerCallbackQuery();
    const keyboard = new InlineKeyboard().text("Orqaga","backToMenu")
    return ctx.reply("Yordamingizdan juda mamnunmiz ❤️\nKarta: 8600120450184331\nK.S.",{reply_markup:keyboard});
  };
  