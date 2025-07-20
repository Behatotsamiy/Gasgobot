import { InlineKeyboard } from "grammy";
import { MyContext } from "../types.ts";

export async function wantTo_AddStantion(ctx: MyContext) {
    ctx.session.prevMenu = "station_menu";
    await ctx.deleteMessage();
    
    const keyboard = new InlineKeyboard()
        .text("Qo'shish", "addStationKB")
        .text("Orqaga qaytish", "backToMenu");
        
    return ctx.reply("Shahobcha qo'sh moqchisizmi?", {
        reply_markup: keyboard
    });
}