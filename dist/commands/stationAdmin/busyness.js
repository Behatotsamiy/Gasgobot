import { InlineKeyboard } from "grammy";
import { StationModel } from "../../Models/Station.js";
import { Station_Admin } from "./stationAdmin.js";
export async function Busyness(ctx) {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("Shaxobcha ID topilmadi.");
    const station = await StationModel.findById(stationId);
    if (!station)
        return ctx.reply("Shaxobcha topilmadi.");
    const currentLevel = station.busyness?.level || "belgilanmagan";
    try {
        await ctx.deleteMessage();
    }
    catch {
        console.log("Message delete did not work baka");
    }
    const keyboard = new InlineKeyboard()
        .text("🟢 Green", `busyness_set:${stationId}:green`)
        .row()
        .text("🟠 Orange", `busyness_set:${stationId}:orange`)
        .row()
        .text("🔴 Red", `busyness_set:${stationId}:red`)
        .row()
        .text("Orqaga", `station_menu:${stationId}`);
    await ctx.reply(`📍 *${station.name}*\nJoriy bandlik darajasi: *${currentLevel.toUpperCase()}*\n\nO'zgartirmoqchimisiz?`, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
}
export async function ChangeBusyness(ctx) {
    const data = ctx.callbackQuery?.data;
    if (!data)
        return;
    const [, stationId, level] = data.split(":");
    if (!stationId || !level)
        return ctx.reply("Noto'g'ri ma'lumot.");
    if (!["green", "orange", "red"].includes(level)) {
        return ctx.reply("Noto'g'ri bandlik darajasi.");
    }
    const station = await StationModel.findById(stationId);
    if (!station)
        return ctx.reply("Shaxobcha topilmadi.");
    station.busyness = {
        level: level,
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
    await station.save();
    await ctx.reply(`✅ *${station.name}* shaxobchasining bandlik darajasi *${level.toUpperCase()}* ga o'zgartirildi.`, { parse_mode: "Markdown" });
    return Station_Admin(ctx);
}
