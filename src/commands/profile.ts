import { InlineKeyboard } from "grammy";
import { UserModel } from "../Models/User.js";
import { MyContext } from "../types.js";

export const profile = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  const user = await UserModel.findOne({ telegramId: ctx.from?.id });
  if (!user) {
    return ctx.editMessageText("Sizning profilingiz topilmadi. Iltimos, avval ro'yhatdan o'ting.");
  }

  const registrDate = user.createdAt.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return ctx.editMessageText(
    `Sizning Profilingiz:\n\nIsm: @${ctx.from?.username}\nRo'yhatga olingan sana: ${registrDate}`,
    {
      reply_markup: new InlineKeyboard().text("Orqaga", "backToMenu"),
    }
  );
};
