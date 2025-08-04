import { InlineKeyboard } from "grammy";
export async function GetUserFeedback(ctx) {
    ctx.session.step = "awaiting_feedback";
    ctx.session.prevMenu = "help_menu";
    const Keyboard = new InlineKeyboard().text("Ortga", "backToMenu");
    await ctx.reply("Bot adminlariga yozmoqchi bolgan fikr va takliflaringizni yozing!", { reply_markup: Keyboard });
}
