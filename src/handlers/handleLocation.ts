import { MyContext } from "../types.ts";
import { UserModel } from "../Models/User.ts";
import { showFuelSelection } from "../keyboards/_index.ts";
import { locationRequestKeyboard } from "../keyboards/location.ts";
import { Keyboard } from "grammy";

export const handleLocationSharing = async (ctx: MyContext) => {
    const keyboard = new Keyboard()
    .requestLocation("📍 Joylashuvni yuborish")
    .resized();

  const location = ctx.message?.location;
  if (!location)
    return ctx.reply("Iltimos, joylashuvingizni yuboring.", {
      reply_markup: keyboard
    });
  

  const { latitude, longitude } = location;
  const telegramId = ctx.from?.id;
  const first_name = ctx.from?.first_name || "Foydalanuvchi";

  if (!telegramId) return ctx.reply("Foydalanuvchi topilmadi.");

  try {
    const user = await UserModel.findOneAndUpdate(
      { telegramId },
      { $set: { location: { lat: latitude, lng: longitude } } },
      { new: true }
    );

    if (!user) return ctx.reply("Foydalanuvchi bazadan topilmadi.");

    await ctx.reply(`✅ Joylashuvingiz saqlandi:\n🌍 ${latitude}, ${longitude}`, {
      reply_markup: { remove_keyboard: true },
    });

    await ctx.reply(`Qaytganingizdan xursandmiz, ${first_name}!`);
    return showFuelSelection(ctx);

  } catch (err) {
    console.error("📍 Location saqlashda xatolik:", err);
    return ctx.reply("Joylashuvni saqlashda xatolik yuz berdi.");
  }
};
