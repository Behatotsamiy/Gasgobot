import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.js";

export const donateKeyboard = (ctx: MyContext) => {
  ctx.answerCallbackQuery();
  ctx.callbackQuery?.message?.editText("Proyekt rivoji uchun yordam:", {
    reply_markup: new InlineKeyboard()
      .text("💳 Pul bilan yordam qilish kartasi", "money")
      .row()
      .text("⛽Oz shaxobcham",  "addStationKB").row()
      .text("Orqaga" , "backToMenu")
  });
};