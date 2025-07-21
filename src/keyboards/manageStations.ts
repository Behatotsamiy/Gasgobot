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
        .row()
        .text("Orqaga", "station_admin");
    
    return ctx.reply(name, { reply_markup: keyboard });
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

export async function editStation(ctx: MyContext, id: unknown) {
    const data = ctx.callbackQuery?.data;
    await ctx.deleteMessage();
    
    const keyboard = new InlineKeyboard()
        .text("Nomi", `station_name_change:${id}`)
        .text("Yoqilg'i", `station_gas_change:${id}`)
        .text("Joylashuvi", `station_location_change:${id}`)
        .row()
        .text("Orqaga", `user_station_info:${id}`);
    
    if (data === `station_name_change:${id}`) {
        return ctx.reply("📝 Yangi nom kiriting:", {
            reply_markup: new InlineKeyboard()
                .text("❌ Bekor qilish", `edit_station:${id}`)
        });
    }
    
    if (data === `station_gas_change:${id}`) {
        const fuelKeyboard = new InlineKeyboard()
            .text("⛽ A-80", `fuel_select_80:${id}`)
            .text("⛽ A-91", `fuel_select_91:${id}`)
            .row()
            .text("⛽ A-95", `fuel_select_95:${id}`)
            .text("⛽ Diesel", `fuel_select_diesel:${id}`)
            .row()
            .text("⛽ Gas", `fuel_select_gas:${id}`)
            .text("✅ Tayyor", `fuel_done:${id}`)
            .row()
            .text("❌ Bekor qilish", `edit_station:${id}`);
        
        return ctx.reply("⛽ Mavjud yoqilg'i turlarini tanlang:", {
            reply_markup: fuelKeyboard
        });
    }
    
    if (data === `station_location_change:${id}`) {
        return ctx.reply("📍 Yangi joylashuvni yuboring (latitude, longitude formatida yoki lokatsiya yuborib):", {
            reply_markup: new InlineKeyboard()
                .text("❌ Bekor qilish", `edit_station:${id}`)
        });
    }
    
    // Default case - show edit options
    return ctx.reply("Shahobchani o'zgartirmoqchi bo'lgan malumotingizni tanlang:", {
        reply_markup: keyboard
    });
}

// Additional helper functions for handling station operations

export async function handleStationNameUpdate(ctx: MyContext, id: unknown, newName: string) {
    try {
        // Here you would update the station name in your database
        // Example: await updateStationName(id, newName);
        
        await ctx.reply(`✅ Shahobcha nomi "${newName}" ga o'zgartirildi!`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `user_station_info:${id}`)
        });
    } catch (error) {
        await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `edit_station:${id}`)
        });
    }
}

export async function handleFuelSelection(ctx: MyContext, id: unknown, fuelType: string) {
    // This function would handle fuel type selection
    // You might want to store selected fuel types in session or temporary storage
    const selectedFuels = ctx.session?.selectedFuels || [];
    
    if (selectedFuels.includes(fuelType)) {
        // Remove if already selected
        const index = selectedFuels.indexOf(fuelType);
        selectedFuels.splice(index, 1);
    } else {
        // Add if not selected
        selectedFuels.push(fuelType);
    }
    
    // Store in session
    if (ctx.session) {
        ctx.session.selectedFuels = selectedFuels;
    }
    
    const fuelKeyboard = new InlineKeyboard()
        .text(`${selectedFuels.includes('80') ? '✅' : '⛽'} A-80`, `fuel_select_80:${id}`)
        .text(`${selectedFuels.includes('91') ? '✅' : '⛽'} A-91`, `fuel_select_91:${id}`)
        .row()
        .text(`${selectedFuels.includes('95') ? '✅' : '⛽'} A-95`, `fuel_select_95:${id}`)
        .text(`${selectedFuels.includes('diesel') ? '✅' : '⛽'} Diesel`, `fuel_select_diesel:${id}`)
        .row()
        .text(`${selectedFuels.includes('gas') ? '✅' : '⛽'} Gas`, `fuel_select_gas:${id}`)
        .text("✅ Tayyor", `fuel_done:${id}`)
        .row()
        .text("❌ Bekor qilish", `edit_station:${id}`);
    
    return ctx.editMessageText(`⛽ Mavjud yoqilg'i turlarini tanlang:\nTanlangan: ${selectedFuels.join(', ') || 'Hech narsa'}`, {
        reply_markup: fuelKeyboard
    });
}

export async function handleLocationUpdate(ctx: MyContext, id: unknown) {
    const message = ctx.message;
    let lat: number, lng: number;
    
    try {
        if (message?.location) {
            // If user sent location
            lat = message.location.latitude;
            lng = message.location.longitude;
        } else if (message?.text) {
            // If user sent coordinates as text
            const coords = message.text.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                [lat, lng] = coords;
            } else {
                throw new Error('Invalid coordinate format');
            }
        } else {
            throw new Error('Invalid location data');
        }
        
        // Here you would update the station location in your database
        // Example: await updateStationLocation(id, lat, lng);
        
        await ctx.reply(`✅ Shahobcha joylashuvi o'zgartirildi!\n📍 Yangi koordinatalar: ${lat}, ${lng}`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `user_station_info:${id}`)
        });
    } catch (error) {
        await ctx.reply("❌ Noto'g'ri format! Iltimos, koordinatalarni 'latitude, longitude' formatida yuboring yoki lokatsiya yuboring.", {
            reply_markup: new InlineKeyboard()
                .text("❌ Bekor qilish", `edit_station:${id}`)
        });
    }
}

export async function confirmDeleteStation(ctx: MyContext, id: unknown, stationName?: string) {
    const keyboard = new InlineKeyboard()
        .text("✅ Ha, o'chirish", `confirm_delete:${id}`)
        .text("❌ Yo'q, bekor qilish", `user_station_info:${id}`);
    
    const message = stationName 
        ? `🗑 "${stationName}" shahobchasini o'chirishga ishonchingiz komilmi?`
        : `🗑 Shahobchani o'chirishga ishonchingiz komilmi?`;
    
    return ctx.reply(message, { reply_markup: keyboard });
}

export async function deleteStationConfirmed(ctx: MyContext, id: unknown) {
    try {
        // Here you would delete the station from your database
        // Example: await deleteStation(id);
        
        await ctx.reply("✅ Shahobcha muvaffaqiyatli o'chirildi!", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Bosh menu", "station_admin")
        });
    } catch (error) {
        await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Orqaga", `user_station_info:${id}`)
        });
    }
}