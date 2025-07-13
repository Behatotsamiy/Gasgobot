import { MyContext } from "../types.js";
import { fuelKeyboard } from "./_fuelkeyboard.js";

export const backToMenuKeyboard = (ctx: MyContext) => {
  ctx.answerCallbackQuery();
  ctx.callbackQuery?.message?.editText("Endi yonilg'i turini tanlang:", {
    reply_markup: fuelKeyboard,
  });
};
