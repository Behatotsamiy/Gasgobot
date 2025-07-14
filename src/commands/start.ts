import { InlineKeyboard, Keyboard } from "grammy";
import { UserModel } from "../Models/User.js";
import { MyContext } from "../types.js";
import { fuelKeyboard } from "../keyboards/_fuelkeyboard.js";
import { safeReply } from "../safeReply.js";

export const start = async (ctx: MyContext) => {
  if (!ctx.from) {
    return ctx.reply("User information is not available.");
  }

  const { id, first_name, username } = ctx.from;

  try {
    const user = await UserModel.findOne({ telegramId: id });

    // Если пользователь уже существует и у него есть номер, но нет локации
    if (user && user.phone_number && !user.location?.lat) {
      const locationKeyboard = new Keyboard()
        .requestLocation("📍 Joylashuvni yuborish")
        .resized()
        .oneTime();

      return safeReply(ctx, "Iltimos, joylashuvingizni yuboring:", {
        reply_markup: locationKeyboard,
      });
    }

    // Если пользователя нет или у него нет номера телефона
    if (!user || !user.phone_number) {
      const contactKeyboard = new Keyboard()
        .requestContact("📞 Kontaktni yuborish")
        .resized()
        .oneTime();

      // Если нового создаём
      if (!user) {
        const newUser = new UserModel({
          telegramId: id,
          firstName: first_name,
          username: username || "",
        });
        await newUser.save();

        await safeReply(ctx,`Xush kelibsiz, ${first_name}!`);
      }

      return safeReply(ctx,"Iltimos, telefon raqamingizni yuboring:", {
        reply_markup: contactKeyboard,
      });
    }

    // Если у пользователя уже есть и контакт, и локация
    return safeReply(ctx, "Siz allaqachon ro'yxatdan o'tgansiz.", {
      reply_markup: fuelKeyboard
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    safeReply(ctx, "Xatolik yuz berdi, iltimos keyinroq qaytadan urinib ko'ring.");
  }
};