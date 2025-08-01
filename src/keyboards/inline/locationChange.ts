import { MyContext } from "../../types.ts";
import { InlineKeyboard } from "grammy";

export async function location_change(ctx:MyContext){
  try{await ctx.deleteMessage()}catch{console.log("Message delete did not work baka")}

  const keyboard = new InlineKeyboard()
    .text("✅ Ha", "location:yes")
    .text("⬅️ Ortga", "backToMenu");

  await ctx.reply("📍 Siz joylashuvni o'zgartirmoqchimisiz?", {
    reply_markup: keyboard,
  });
}