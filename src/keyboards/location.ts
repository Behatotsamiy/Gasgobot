import { UserModel } from "../Models/User.js";
import { MyContext } from "../types.js";
import { fuelKeyboard } from "./_fuelkeyboard.js";

export const locationKeyboard = async (ctx: MyContext) => {
  const location = ctx.message?.location;
  if (!location) {
    return ctx.reply("Iltimos, joylashuvingizni yuboring.");
  }
  const { latitude, longitude } = location;

  const first_name = ctx.from?.first_name || "Foydalanuvchi";

  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return ctx.reply("Foydalanuvchi topilmadi.");

    const user = await UserModel.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          location: { lat: latitude, lng: longitude },
        },
      },
      { new: true } // возвращает обновлённый документ
    );

    if (!user) {
      return ctx.reply("Foydalanuvchi bazadan topilmadi.");
    }

    await ctx.reply(
      `✅ Joylashuvingiz saqlandi:\n🌍 ${latitude}, ${longitude}`,
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
    // Отправляем сообщение с кнопкой "Меню"
    await ctx.reply(`Qaytish bilan, ${first_name}!`, {});

    await ctx.reply("Endi yonilg'i turini tanlang:", {
      reply_markup: fuelKeyboard,
    });
  } catch (err) {
    console.error("Location saqlashda xatolik:", err);
    ctx.reply("Joylashuvni saqlashda xatolik yuz berdi.");
  }
};
