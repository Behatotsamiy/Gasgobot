import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.ts";

export async function stationAdmin_Keyboard(ctx: MyContext) {
    const keyboard = new InlineKeyboard()
        .text("Mening shaxobchalarim", "station_info")

    const username = ctx.from?.first_name || "Admin";
    await ctx.reply(`Hayrli kun, ${username}! Quyidagi menyudan tanlang:`, {
        reply_markup: keyboard,
    });
}
