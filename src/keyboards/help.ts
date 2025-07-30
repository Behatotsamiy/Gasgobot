import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.ts";

export const donateKeyboard = (ctx: MyContext) => {
  ctx.answerCallbackQuery();
  ctx.callbackQuery?.message?.editText("Proyekt rivoji uchun yordam:", {
    reply_markup: new InlineKeyboard()
      .text("💳 Pul bilan yordam qilish kartasi", "money")
      .row()
      .text("Fikr va taklif yuborish", "feedback")
      .row()
      .text("⛽Shahobcha qo'shish", "addStationKB")
      .row()
      .text("Orqaga", "backToMenu"),
  });
};
