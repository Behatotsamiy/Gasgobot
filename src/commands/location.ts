import { UserModel } from "../Models/User.ts";
import { MyContext } from "../types.ts";
import { showFuelSelection } from "../keyboards/_fuelkeyboard.ts";

export const locationKeyboard = async (ctx: MyContext) => {
  const location = ctx.message?.location;
  if (!location) {
    return ctx.reply("Iltimos, joylashuvingizni yuboring.");
  }

  const { latitude, longitude } = location;
  const telegramId = ctx.from?.id;
  const first_name = ctx.from?.first_name || "Foydalanuvchi";

  if (!telegramId) {
    return ctx.reply("Foydalanuvchi topilmadi.");
  }

  try {
    const user = await UserModel.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          location: { lat: latitude, lng: longitude },
        },
      },
      { new: true } // return the updated user
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

    await ctx.reply(`Qaytganingizdan xursandmiz, ${first_name}!`);
    return showFuelSelection(ctx)

  } catch (err) {
    console.error("📍 Location saqlashda xatolik:", err);
    return ctx.reply("Joylashuvni saqlashda xatolik yuz berdi.");
  }
};
