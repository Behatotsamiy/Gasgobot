import { MyContext } from "../../types.ts";
import { InlineKeyboard } from "grammy";

export async function location_change(ctx:MyContext){
    await ctx.deleteMessage();
    const keyboard = new InlineKeyboard()
      .text("✅ Ha", "location:yes")
      .text("⬅️ Ortga", "backToMenu");
  
    await ctx.reply("📍 Siz joylashuvni o'zgartirmoqchimisiz?", {
      reply_markup: keyboard,
    });
}