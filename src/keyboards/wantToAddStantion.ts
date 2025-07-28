import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.ts";

export async function wantTo_AddStantion(ctx: MyContext) {
  ctx.session.prevMenu = "station_menu";

  const keyboard = new InlineKeyboard()
    .text("➕ Qo'shish", "addStationKB")
    .row()
    .text("⬅️ Ortga qaytish", "backToMenu");

  const messageText =
    ctx.session.step === "confirm_add_station"
      ? "❗ Sizda birorta ham stansiya ro'yxatdan o'tmagan.\nYangi stansiya qo'shmoqchimisiz?"
      : "Yana bir stansiya qo‘shmoqchimisiz?";

  return ctx.reply(messageText, {
    reply_markup: keyboard,
  });
}
