import { InlineKeyboard } from "grammy";
import { StationModel } from "../Models/Station.ts";
import { UserModel } from "../Models/User.ts";
import { MyContext } from "../types.ts";

export async function wantTo_AddStantion(ctx: MyContext) {
  ctx.session.prevMenu = "station_menu";

  const user = await UserModel.findOne({ telegramId: ctx.from?.id });
  if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");

  const userStations = await StationModel.find({ owner: user._id });

  const keyboard = new InlineKeyboard()
    .text("➕ Qo'shish", "addStationKB")
    .row()
    .text("⬅️ Ortga qaytish", "backToMenu");

  const messageText =
    userStations.length === 0
      ? "❗ Sizda birorta ham stansiya ro'yxatdan o'tmagan.\nYangi stansiya qo'shmoqchimisiz?"
      : "Yana bir stansiya qo‘shmoqchimisiz?";

  return ctx.reply(messageText, {
    reply_markup: keyboard,
  });
}
