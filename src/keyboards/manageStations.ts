import { StationModel } from "../Models/Station.ts";
import { UserModel } from "../Models/User.ts";
import { MyContext } from "../types.ts";
import { InlineKeyboard } from "grammy";

type stn = {
    _id: unknown;
    name: string;
    fuel_types: string[];
    status: string;
    location: {
        lat: number;
        lng: number;
    };
};

export async function StaitonShort(name: string, id: string, ctx: MyContext) {
    await ctx.deleteMessage();
    
    const keyboard = new InlineKeyboard()
        .text(`Malumot`, `user_station_info:${id}`)
        .text(`O'chirib tashlash`, `delete_station:${id}`)
    
    await ctx.reply(name, { reply_markup: keyboard });
}

export async function Stationlong(station: stn, ctx: MyContext) {
    await ctx.deleteMessage();
    
    const keyboard = new InlineKeyboard()
        .text("✏️ O'zgartirish", `edit_station:${station._id}`)
        .text("🗑 O'chirish", `delete_station:${station._id}`)
        .row()
        .text("🔙 Orqaga", "station_info");
    
    const msg =
        `🏷 Nomi: ${station.name}\n` +
        `⛽ Yonilg'i: ${station.fuel_types.join(", ")}\n` +
        `📍 Koordinatalar: ${station.location.lat}, ${station.location.lng}\n` +
        `📊 Status: ${station.status}\n` +
        `🆔 ID: ${station._id}`;
    
    return ctx.reply(msg, { reply_markup: keyboard });
}

export async function editStation(ctx: MyContext, id: unknown, call: string | undefined) {
    await ctx.deleteMessage();

    if (call === "station_name_change") {
        ctx.session.step = "station_name_change";
        ctx.session.editingStationId = id;
        return ctx.reply("Shaxobcha yangi nomini kiriting!");
    }

    if (call === "station_gas_change") {
        console.log("➡️ station_gas_change triggered");
      
        ctx.session.step = "station_gas_change";
        ctx.session.editingStationId = id;
        console.log("📝 ctx.session.step set to:", ctx.session.step);
      
        const user = await UserModel.findOne({ telegramId: ctx.from.id });
        if (!user) {
            console.log("❌ User not found");
            return ctx.reply("❌ Foydalanuvchi topilmadi.");
        }
      
        const station = await StationModel.findById(id);
        if (!station) {
            console.log("❌ Station not found with id:", id);
            return ctx.reply("❌ Stansiya topilmadi.");
        }
      
        // Store current station data in session
        ctx.session.station = {
            name: station.name,
            fuel_types: [...station.fuel_types], // Create a copy
            location: station.location,
        };
        console.log("✅ ctx.session.station set to:", ctx.session.station);
      
        return showFuelSelectionMenu(ctx, ctx.session.station.fuel_types);
    }

    if (call === "station_location_change") {
        ctx.session.step = "station_location_change";
        ctx.session.editingStationId = id;
        return ctx.reply("Shaxobchaning yangi joylashuvini 42.4242, 69.6969 formatida yoki lokatsiya orqali o'zgartiring");
    }
    
    const keyboard = new InlineKeyboard()
        .text("Nomi", `station_name_change:${id}`)
        .text("Yoqilg'i", `station_gas_change:${id}`)
        .text("Joylashuvi", `station_location_change:${id}`)
        .row()
        .text("Orqaga", `user_station_info:${id}`);

    return ctx.reply("Shaxobchani o'zgartirmoqchi bo'lgan ma'lumotingizni tanlang:", {
        reply_markup: keyboard
    });
}

// Helper function to show fuel selection menu for EDITING (different from creation)
function showFuelSelectionMenu(ctx: MyContext, selectedFuels: string[]) {
    const fuelTypes = ["AI-80", "AI-91", "AI-92", "AI-95", "AI-98", "Dizel", "Metan", "Propan", "Elektrik"];
    
    const getEditFuelKeyboard = (selected: string[]) => ({
        inline_keyboard: [
            ...fuelTypes.map(fuel => [{
                text: selected.includes(fuel) ? `✅ ${fuel}` : fuel,
                callback_data: `edit_fuel_select:${fuel}` // Different prefix for editing
            }]),
            [{ text: "✅ Tayyor", callback_data: "edit_fuel_complete" }], // Different callback
            [{ text: "🔙 Orqaga", callback_data: `edit_station:${ctx.session.editingStationId}` }]
        ]
    });
    
    console.log("📤 Sending EDIT fuel selection keyboard");
    return ctx.reply("⛽ Yoqilg'i turlarini tanlang:", {
        reply_markup: getEditFuelKeyboard(selectedFuels)
    });
}

// Handle individual fuel selection for EDITING
export async function handleEditFuelSelection(ctx: MyContext, fuelType: string) {
    console.log("🔧 handleEditFuelSelection called with:", fuelType);
    
    if (ctx.session.step !== "station_gas_change" || !ctx.session.station) {
        console.log("🚫 Invalid session state");
        return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    }
    
    const currentFuels = ctx.session.station.fuel_types;
    
    // Toggle fuel selection
    if (currentFuels.includes(fuelType)) {
        // Remove fuel type
        ctx.session.station.fuel_types = currentFuels.filter(f => f !== fuelType);
        console.log(`🔴 Removed ${fuelType}, current selection:`, ctx.session.station.fuel_types);
    } else {
        // Add fuel type
        ctx.session.station.fuel_types.push(fuelType);
        console.log(`🟢 Added ${fuelType}, current selection:`, ctx.session.station.fuel_types);
    }
    
    // Update the keyboard with new selection
    const fuelTypes = ["AI-80", "AI-91", "AI-92", "AI-95", "AI-98", "Dizel", "Metan", "Propan", "Elektrik"];
    const selected = ctx.session.station.fuel_types;
    
    const getEditFuelKeyboard = (selected: string[]) => ({
        inline_keyboard: [
            ...fuelTypes.map(fuel => [{
                text: selected.includes(fuel) ? `✅ ${fuel}` : fuel,
                callback_data: `edit_fuel_select:${fuel}`
            }]),
            [{ text: "✅ Tayyor", callback_data: "edit_fuel_complete" }],
            [{ text: "🔙 Orqaga", callback_data: `edit_station:${ctx.session.editingStationId}` }]
        ]
    });
    
    try {
        await ctx.editMessageReplyMarkup({ reply_markup: getEditFuelKeyboard(selected) });
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.log("❌ Error updating keyboard:", error);
        await ctx.answerCallbackQuery({ text: "Xatolik yuz berdi" });
    }
}

// Handle fuel selection completion
export async function handleFuelDone(ctx: MyContext) {
    console.log("🛠️ handleFuelDone callback triggered");
    
    if (ctx.session.step !== "station_gas_change") {
        console.log("🚫 Incorrect session.step — expected 'station_gas_change'");
        return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    }
    
    if (!ctx.session.station || !ctx.session.station.fuel_types?.length) {
        console.log("🚫 Missing station data or no fuel types selected");
        return ctx.answerCallbackQuery({
            text: "🚫 Hech bo'lmaganda bitta yoqilg'i turi tanlang!",
            show_alert: true,
        });
    }
    
    const user = await UserModel.findOne({ telegramId: ctx.from.id });
    if (!user) {
        console.log("❌ User not found");
        return ctx.reply("❌ Foydalanuvchi topilmadi.");
    }
    
    const updated = await StationModel.findByIdAndUpdate(
        ctx.session.editingStationId,
        { fuel_types: ctx.session.station.fuel_types },
        { new: true }
    );
    
    if (!updated) {
        console.log("❌ Failed to update station");
        return ctx.reply("❌ Stansiyani yangilab bo'lmadi.");
    }
    
    console.log("✅ Station fuel_types updated:", updated.fuel_types);
    
    await ctx.editMessageText("✅ Yoqilg'i turlari muvaffaqiyatli yangilandi!");
    
    // Clear session
    ctx.session.step = undefined;
    ctx.session.station = undefined;
    ctx.session.editingStationId = undefined;
    
    return ctx.answerCallbackQuery();
}

export async function handleStationNameUpdate(ctx: MyContext, newName: string) {
    try {
        const user = await UserModel.findOne({ telegramId: ctx.from.id });
        if (!user) {
            return ctx.reply("❌ Foydalanuvchi topilmadi.");
        }

        const updated = await StationModel.findByIdAndUpdate(
            ctx.session.editingStationId,
            { name: newName },
            { new: true }
        );

        if (!updated) {
            return ctx.reply("❌ Stansiya nomini yangilab bo'lmadi.");
        }

        ctx.session.step = undefined;
        ctx.session.editingStationId = undefined;

        await ctx.reply(`✅ Shaxobcha nomi "${newName}" ga o'zgartirildi!`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `user_station_info:${updated._id}`)
        });
    } catch (error) {
        console.log("❌ Error updating station name:", error);
        await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `edit_station:${ctx.session.editingStationId}`)
        });
    }
}

// Handle location update
export async function handleStationLocationUpdate(ctx: MyContext, locationInput: string) {
    try {
        let lat: number, lng: number;

        // Check if it's coordinate format (lat, lng)
        const coordMatch = locationInput.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
        } else {
            return ctx.reply("❌ Noto'g'ri format. Iltimos, 42.4242, 69.6969 formatida kiriting yoki lokatsiya yuboring.");
        }

        const user = await UserModel.findOne({ telegramId: ctx.from.id });
        if (!user) {
            return ctx.reply("❌ Foydalanuvchi topilmadi.");
        }

        const updated = await StationModel.findByIdAndUpdate(
            ctx.session.editingStationId,
            { 
                location: { lat, lng }
            },
            { new: true }
        );

        if (!updated) {
            return ctx.reply("❌ Stansiya joylashuvini yangilab bo'lmadi.");
        }

        ctx.session.step = undefined;
        ctx.session.editingStationId = undefined;

        await ctx.reply(`✅ Shaxobcha joylashuvi (${lat}, ${lng}) ga o'zgartirildi!`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `user_station_info:${updated._id}`)
        });
    } catch (error) {
        console.log("❌ Error updating station location:", error);
        await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `edit_station:${ctx.session.editingStationId}`)
        });
    }
}