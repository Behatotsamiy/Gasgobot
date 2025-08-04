import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.js";

export const donateKeyboard = async (ctx: MyContext) => {
  const keyboard = new InlineKeyboard()
    .text("💳 Pul bilan yordam qilish kartasi", "money")
    .row()
    .text("Fikr va taklif yuborish", "feedback")
    .row()
    .text("⛽Shahobcha qo'shish", "addStationKB")
    .row()
    .text("Orqaga", "backToMenu");

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
    return ctx.editMessageText("Proyekt rivoji uchun yordam:", {
      reply_markup: keyboard,
    });
  } else {
    return ctx.reply("Proyekt rivoji uchun yordam:", {
      reply_markup: keyboard,
    });
  }
};
