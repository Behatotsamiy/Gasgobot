import { MyContext } from "../types.js";
import { showFuelSelection } from "./_fuelkeyboard.ts";

export const backToMenuKeyboard = async (ctx: MyContext) => {
  ctx.answerCallbackQuery();
  await ctx.deleteMessage();
  return showFuelSelection(ctx)
};
