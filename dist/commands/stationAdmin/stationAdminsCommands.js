import { UserModel } from "../../Models/User.js";
import { StationModel } from "../../Models/Station.js";
import { InlineKeyboard } from "grammy";
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.js";
import { Stationlong, editStation } from "./manageStations.js";
/**
 * Utility function to safely delete a message.
 */
async function safeDeleteMessage(ctx) {
    try {
        await ctx.deleteMessage();
    }
    catch (error) {
        console.log("station admin menu deletion failed or message was already deleted.");
    }
}
// =======================================================
// === MAIN STATION COMMANDS =============================
// =======================================================
export async function stationInfo(ctx) {
    if ("callback_query" in ctx.update)
        await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    ctx.session.prevMenu = "stations";
    const user = await UserModel.findOne({ telegramId: ctx.from?.id });
    if (!user)
        return ctx.reply("Foydalanuvchi topilmadi");
    const stations = await StationModel.find({ owner: user._id });
    if (stations.length < 1) {
        return wantTo_AddStantion(ctx);
    }
    const keyboard = stations.map((station) => [
        { text: station.name, callback_data: `station_menu:${station._id}` },
    ]);
    keyboard.push([{ text: "➕ Yangi shaxobcha", callback_data: "add_station" }]);
    return ctx.reply("Sizning stansiyalaringiz:", {
        reply_markup: { inline_keyboard: keyboard },
    });
}
export async function handleStationMainMenu(ctx) {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    const station = await StationModel.findById(stationId);
    if (!station) {
        return ctx.editMessageText("❌ Stansiya topilmadi");
    }
    const keyboard = new InlineKeyboard()
        .text("💵 Narxlar", `pricelist:${stationId}`)
        .row()
        .text("⛽ Yoqilg'i", `station_gas_change:${stationId}`)
        .row()
        .text("🕐 Ish vaqti", `station_time:${stationId}`)
        .row()
        .text("📊 Bandlik", `station_busyness:${stationId}`)
        .row()
        .text("Malumotlar", `user_station_info:${stationId}`)
        .row()
        .text("⬅️ Orqaga", "backToMenu");
    await ctx.editMessageText(`📍 *${station.name}* menyusi:`, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
}
export const userStationInfo = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const station = await StationModel.findById(stationId);
    if (!station) {
        return ctx.reply("❌ Stansiya topilmadi");
    }
    const plainPricing = {};
    for (const [fuel, price] of Object.entries(station.pricing)) {
        plainPricing[fuel] = price;
    }
    return Stationlong(station, ctx);
};
// --- Edit/Delete ---
export const stationChange = async (ctx) => {
    const call = ctx.callbackQuery?.data?.split(":")[0];
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const station = await StationModel.findById(stationId);
    if (!station)
        return ctx.reply("❌ Stansiya topilmadi");
    if (call?.startsWith("edit_station")) {
        const keyboard = new InlineKeyboard()
            .text("Lokatsiya", `station_location_change:${stationId}`)
            .row()
            .text("Nomi", `station_name_change:${stationId}`)
            .row()
            .text("Egalik", `station_owner_transfer:${stationId}`);
        return ctx.reply("Shaxobchangizning qaysi malumotini o'zgartirmoqchisiz?", {
            reply_markup: keyboard,
        });
    }
    return editStation(ctx, station._id, call);
};
export const deleteStation = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    const station = await StationModel.findById(stationId);
    if (!station)
        return ctx.reply("❌ Stansiya topilmadi");
    await station.deleteOne();
    try {
        await ctx.editMessageText("✅ Stansiya o'chirildi");
    }
    catch { }
    return stationInfo(ctx);
};
// =======================================================
// === PRICE MANAGEMENT ==================================
// =======================================================
export const pricelist = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const keyboard = new InlineKeyboard()
        .text("💰 Narx belgilash", `change_prices:${stationId}`)
        .row()
        .text("📊 Hozirgi narxlar", `view_prices:${stationId}`)
        .row()
        .text("⬅️ Ortga", `station_menu:${stationId}`);
    return ctx.reply("Quyidagilardan birini tanlang", { reply_markup: keyboard });
};
export const changePrice = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    const station = await StationModel.findById(stationId);
    if (!station)
        return ctx.reply("Stansiya topilmadi");
    ctx.session.currentStationId = stationId;
    ctx.session.pendingPrices = {};
    ctx.session.availableFuels = station.fuel_types;
    ctx.session.currentFuelIndex = 0;
    return askForFuelPrice(ctx);
};
const askForFuelPrice = async (ctx) => {
    const fuels = ctx.session.availableFuels || [];
    const i = ctx.session.currentFuelIndex || 0;
    const stationId = ctx.session.currentStationId;
    if (i >= fuels.length)
        return showPriceSummary(ctx);
    const currentFuel = fuels[i];
    ctx.session.step = "setting_price";
    ctx.session.currentFuel = currentFuel;
    const keyboard = new InlineKeyboard()
        .text("⏭️ O'tkazib yuborish", `skip_fuel_price`)
        .row()
        .text("❌ Bekor qilish", `cancel_price_save`);
    const msg = `⛽ **${currentFuel}** uchun narxni kiriting (so'm):\n\nMisol: 12500\n\n${i + 1}/${fuels.length}`;
    await safeDeleteMessage(ctx);
    return ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
};
export const handleFuelPriceInput = async (ctx, priceText) => {
    if (ctx.session.step !== "setting_price")
        return;
    const price = parseInt(priceText.replace(/\s/g, ""));
    if (isNaN(price) || price <= 0) {
        return ctx.reply("❌ Iltimos, to'g'ri narx kiriting (masalan: 12500)");
    }
    const currentFuel = ctx.session.currentFuel;
    if (!currentFuel)
        return;
    ctx.session.pendingPrices[currentFuel] = price;
    ctx.session.currentFuelIndex = (ctx.session.currentFuelIndex || 0) + 1;
    return askForFuelPrice(ctx);
};
export const skipFuelPrice = async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.currentFuelIndex = (ctx.session.currentFuelIndex || 0) + 1;
    return askForFuelPrice(ctx);
};
const showPriceSummary = async (ctx) => {
    const pendingPrices = ctx.session.pendingPrices || {};
    const stationId = ctx.session.currentStationId;
    if (!Object.keys(pendingPrices).length) {
        const keyboard = new InlineKeyboard().text("⬅️ Ortga", `pricelist:${stationId}`);
        await safeDeleteMessage(ctx);
        return ctx.reply("❌ Hech qanday narx kiritilmadi", {
            reply_markup: keyboard,
        });
    }
    let message = "📋 **Kiritilgan narxlar:**\n\n";
    for (const [fuel, price] of Object.entries(pendingPrices)) {
        message += `⛽ ${fuel}: ${price.toLocaleString()} so'm\n`;
    }
    const keyboard = new InlineKeyboard()
        .text("✅ Saqlash", `confirm_price_save:${stationId}`)
        .text("❌ Bekor qilish", `cancel_price_save:${stationId}`);
    await safeDeleteMessage(ctx);
    return ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
};
export const confirmPriceSave = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1] || ctx.session.currentStationId;
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    const { pendingPrices } = ctx.session;
    if (!Object.keys(pendingPrices || {}).length) {
        return ctx.reply("❌ Xatolik: Ma'lumotlar topilmadi");
    }
    try {
        const station = await StationModel.findById(stationId);
        if (!station) {
            return ctx.reply("❌ Stansiya topilmadi");
        }
        if (station.pricing instanceof Map) {
            for (const [fuel, price] of Object.entries(pendingPrices)) {
                if (station.fuel_types.includes(fuel)) {
                    station.pricing.set(fuel, price);
                }
            }
        }
        else {
            // fallback for plain object structure
            for (const [fuel, price] of Object.entries(pendingPrices)) {
                if (station.fuel_types.includes(fuel)) {
                    station.pricing[fuel] = price;
                }
            }
        }
        await station.save();
        // Clear session but keep station ID for navigation
        ctx.session = { currentStationId: stationId };
        const keyboard = new InlineKeyboard().text("🔙 Bosh menyu", `pricelist:${stationId}`);
        await safeDeleteMessage(ctx);
        return ctx.reply("✅ Narxlar muvaffaqiyatli saqlandi!", {
            reply_markup: keyboard,
        });
    }
    catch (e) {
        console.error("Save Error:", e);
        return ctx.reply("❌ Narxlarni saqlashda xatolik yuz berdi");
    }
};
export const cancelPriceSave = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1] || ctx.session.currentStationId;
    await ctx.answerCallbackQuery();
    // Clear session but keep station ID for navigation
    ctx.session = { currentStationId: stationId };
    const keyboard = new InlineKeyboard().text("🔙 Orqaga", `pricelist:${stationId}`);
    await safeDeleteMessage(ctx);
    return ctx.reply("❌ Narx o'rnatish bekor qilindi", {
        reply_markup: keyboard,
    });
};
export const currentPrices = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const keyboard = new InlineKeyboard()
        .text("🧾 Mening narxlarim", `my_prices:${stationId}`)
        .row()
        .text("📊 Raqobatchilar narxlari", `competitor_prices:${stationId}`)
        .row()
        .text("⬅️ Ortga", `pricelist:${stationId}`);
    return ctx.reply("Qaysi narxlarni ko'rmoqchisiz?", {
        reply_markup: keyboard,
    });
};
export const handleMyPrices = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const station = await StationModel.findById(stationId);
    if (!station) {
        const keyboard = new InlineKeyboard().text("⬅️ Ortga", `view_prices:${stationId}`);
        return ctx.reply("❌ Stansiya topilmadi", { reply_markup: keyboard });
    }
    let msg = `⛽ **${station.name}** narxlari:\n\n`;
    for (const fuel of station.fuel_types) {
        const price = station.pricing instanceof Map
            ? station.pricing.get(fuel)
            : station.pricing[fuel];
        msg += `• ${fuel}: ${price ? `${price.toLocaleString()} so'm` : "yo'q"}\n`;
    }
    const keyboard = new InlineKeyboard().text("⬅️ Ortga", `view_prices:${stationId}`);
    return ctx.reply(msg, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
};
export const handleCompetitorPrices = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId)
        return ctx.reply("❌ Stansiya ID topilmadi");
    await ctx.answerCallbackQuery();
    await safeDeleteMessage(ctx);
    const userId = ctx.from?.id;
    const user = await UserModel.findOne({ telegramId: userId });
    if (!user)
        return ctx.reply("Foydalanuvchi topilmadi");
    const competitors = await StationModel.find({ owner: { $ne: user._id } });
    const keyboard = new InlineKeyboard().text("⬅️ Ortga", `view_prices:${stationId}`);
    if (competitors.length === 0) {
        return ctx.reply("❌ Raqobatchi stansiyalar topilmadi.", {
            reply_markup: keyboard,
        });
    }
    const fuelPrices = {};
    for (const station of competitors) {
        if (!station.pricing)
            continue;
        for (const fuel of station.fuel_types) {
            const price = station.pricing instanceof Map
                ? station.pricing.get(fuel)
                : station.pricing[fuel];
            if (typeof price === "number") {
                if (!fuelPrices[fuel])
                    fuelPrices[fuel] = [];
                fuelPrices[fuel].push(price);
            }
        }
    }
    if (Object.keys(fuelPrices).length === 0) {
        return ctx.reply("🚫 Hech qanday ma'lumot yo'q.", {
            reply_markup: keyboard,
        });
    }
    let msg = `📊 **Raqobatchilar narxlari (eng past/eng yuqori):**\n\n`;
    for (const [fuel, prices] of Object.entries(fuelPrices)) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        msg += `⛽ ${fuel}:\n`;
        msg += `   • Eng past: ${min.toLocaleString()} so'm\n`;
        msg += `   • Eng yuqori: ${max.toLocaleString()} so'm\n\n`;
    }
    return ctx.reply(msg.trim(), {
        parse_mode: "Markdown",
        reply_markup: keyboard,
    });
};
export const gasInfo = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    // TODO: Implement gas info functionality with station ID
    console.log("Gas info for station:", stationId);
};
export const workTime = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    // TODO: Implement work time functionality with station ID
    console.log("Work time for station:", stationId);
};
// No longer needed in this flow
export const showStationSelectionForPrices = async (ctx) => { };
export const toggleStation = async (ctx) => { };
export const confirmStationSelection = async (ctx) => { };
