import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.ts";

export async function stationAdmin_Keyboard(ctx: MyContext) {
    const keyboard = new InlineKeyboard()
        .text("Mening shaxobcham", "station_info")
        .text("Shaxobchani o'zgartirish", "station_change")
        .row()
        .text("Narx navo", "pricelist")
        .text("Yoqilg'i holati", "gas_info")
        .row()
        .text("Ish vaqti", "time")
        .text("Statistika", "station_statics")
        .row();

    const username = ctx.from?.first_name || "Admin";
    await ctx.reply(`Hayrli kun, ${username}! Quyidagi menyudan tanlang:`, {
        reply_markup: keyboard,
    });
}
