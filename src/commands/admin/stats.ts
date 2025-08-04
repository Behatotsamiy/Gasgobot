import mongoose from "mongoose";
import { UserModel } from "../../Models/User.js";
import { InlineKeyboard } from "grammy";
import { MyContext } from "../../types.js";

export async function Stats(ctx: MyContext) {
  const mongo_uri = `mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  try {
    await mongoose.connect(mongo_uri);

    const total = await UserModel.countDocuments();
    const withPhone = await UserModel.countDocuments({
      phone_number: { $exists: true },
    });
    const withLocation = await UserModel.countDocuments({
      location: { $exists: true },
    });
    const withPhoneNoLocation = await UserModel.countDocuments({
      phone_number: { $exists: true },
      location: { $exists: false },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await UserModel.countDocuments({
      createdAt: { $gte: today },
    });

    const msg = `
    📊 Statistika:
    
    👤 Umumiy foydalanuvchilar: ${total}
    📞 Telefon raqami bor: ${withPhone}
    📍 Lokatsiya berganlar: ${withLocation}
    🚫 Faqat telefon, lokatsiyasiz: ${withPhoneNoLocation}
    🕒 Bugun qoʻshilganlar: ${todayUsers}
        `.trim();

    const keyboard = new InlineKeyboard().text("⬅️ Back", "admin_panel:back");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(msg, { reply_markup: keyboard });
  } catch (error) {
    console.error("Error in admin_stats:", error);
    await ctx.reply("Statistikani olishda xatolik yuz berdi.");
  }
}
