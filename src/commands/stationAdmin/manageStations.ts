// --- Imports ---
import { StationModel } from "../../Models/Station.ts";
import { UserModel } from "../../Models/User.ts";
import { stationInfo } from "./stationAdminsCommands.ts";
import { MyContext } from "../../types.ts";
import { InlineKeyboard } from "grammy";
import { backToMenuKeyboard } from "../../keyboards/backToMenu.ts";

type stn = {
  _id: unknown;
  name: string;
  fuel_types: string[];
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  pricing: Map<string, number> | { [key: string]: number };
  busyness_level?: string;
};

export async function Stationlong(station: stn, ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("✏️ O'zgartirish", `edit_station:${station._id}`)
    .text("🗑 O'chirish", `delete_station:${station._id}`)
    .row()
    .text("🔙 Orqaga", `station_menu:${station._id}`);

  let msg =
    `🏷 Nomi: ${station.name}\n` +
    `⛽ Yonilg'i: ${station.fuel_types.join(", ")}\n` +
    `📍 Koordinatalar: ${station.location.lat}, ${station.location.lng}\n` +
    `📊 Status: ${station.status}\n`;
    if (station.pricing instanceof Map) {
      for (const [fuel, price] of station.pricing.entries()) {
        msg += `   • ${fuel}: ${price.toLocaleString()} so'm\n`;
      }
    } else {
      const pricing = station.pricing as { [key: string]: number };
      for (const fuel in pricing) {
        const price = pricing[fuel];
        msg += `   • ${fuel}: ${price.toLocaleString()} so'm\n`;
      }
    }
    
  if (station.busyness_level) {
    msg += `🚦 Bandlik: ${station.busyness_level}\n`;
  }

  msg += `🆔 ID: ${station._id}`;

  return ctx.reply(msg.trim(), { reply_markup: keyboard });
}


export async function editStation(ctx: MyContext, id: unknown, call: string | undefined) {
  if (call === "station_name_change") {
    ctx.session.step = "station_name_change";
    ctx.session.editingStationId = id;
    return ctx.reply("Shaxobcha yangi nomini kiriting!");
  }

  if (call === "station_gas_change") {
    ctx.session.step = "station_gas_change";
    ctx.session.editingStationId = id;

    const user = await UserModel.findOne({ telegramId: ctx.from?.id });
    if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");

    const station = await StationModel.findById(id);
    if (!station) return ctx.reply("❌ Stansiya topilmadi.");

    ctx.session.station = {
      name: station.name,
      fuel_types: [...station.fuel_types],
      location: station.location,
    };

    return showFuelSelectionMenu(ctx, ctx.session.station.fuel_types);
  }

  if (call === "station_location_change") {
    ctx.session.step = "station_location_change";
    ctx.session.editingStationId = id;
    return ctx.reply("Shaxobchaning yangi joylashuvini 42.4242, 69.6969 formatida yoki lokatsiya orqali o'zgartiring");
  }
}

function showFuelSelectionMenu(ctx: MyContext, selectedFuels: string[]) {
  ctx.session.prevMenu = "stations";
  const fuelTypes = ["AI-80", "AI-91", "AI-92", "AI-95", "AI-98", "Dizel", "Metan", "Propan", "Elektrik"];

  const getEditFuelKeyboard = (selected: string[]) => ({
    inline_keyboard: [
      ...fuelTypes.map(fuel => [{
        text: selected.includes(fuel) ? `✅ ${fuel}` : fuel,
        callback_data: `edit_fuel_select:${fuel}`
      }]),
      [{ text: "✅ Tayyor", callback_data: "edit_fuel_complete" }],
      [{ text: "🔙 Orqaga", callback_data: `station_menu:${ctx.session.editingStationId}` }]
    ]
  });

  return ctx.reply("⛽ Yoqilg'i turlarini tanlang:", {
    reply_markup: getEditFuelKeyboard(selectedFuels)
  });
}

export async function handleEditFuelSelection(ctx: MyContext, fuelType: string) {
  if (ctx.session.step !== "station_gas_change" || !ctx.session.station) {
    return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
  }

  const currentFuels = ctx.session.station.fuel_types;
  if (currentFuels.includes(fuelType)) {
    ctx.session.station.fuel_types = currentFuels.filter(f => f !== fuelType);
  } else {
    ctx.session.station.fuel_types.push(fuelType);
  }

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
    await ctx.answerCallbackQuery({ text: "Xatolik yuz berdi" });
  }
}

export async function handleFuelDone(ctx: MyContext) {
  if (ctx.session.step !== "station_gas_change") {
    return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
  }

  if (!ctx.session.station?.fuel_types?.length) {
    return ctx.answerCallbackQuery({
      text: "🚫 Hech bo'lmaganda bitta yoqilg'i turi tanlang!",
      show_alert: true,
    });
  }

  const user = await UserModel.findOne({ telegramId: ctx.from?.id });
  if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");

  const updated = await StationModel.findByIdAndUpdate(
    ctx.session.editingStationId,
    { fuel_types: ctx.session.station.fuel_types },
    { new: true }
  );

  if (!updated) return ctx.reply("❌ Stansiyani yangilab bo'lmadi.");

  await ctx.editMessageText("✅ Yoqilg'i turlari muvaffaqiyatli yangilandi!");
  ctx.session.step = undefined;
  ctx.session.station = undefined;
  ctx.session.editingStationId = undefined;

  return stationInfo(ctx);
}

export async function handleStationNameUpdate(ctx: MyContext, newName: string) {
  const user = await UserModel.findOne({ telegramId: ctx.from?.id });
  if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");

  const updated = await StationModel.findByIdAndUpdate(
    ctx.session.editingStationId,
    { name: newName },
    { new: true }
  );

  if (!updated) return ctx.reply("❌ Stansiya nomini yangilab bo'lmadi.");

  ctx.session.step = undefined;
  ctx.session.editingStationId = undefined;

  await ctx.reply(`✅ Shaxobcha nomi "${newName}" ga o'zgartirildi!`, {
    reply_markup: new InlineKeyboard().text("🔙 Orqaga", `user_station_info:${updated._id}`)
  });
}

export async function handleStationLocationUpdate(ctx: MyContext, locationInput: string) {
  let lat: number, lng: number;
  const coordMatch = locationInput.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  } else {
    return ctx.reply("❌ Noto'g'ri format. Iltimos, 42.4242, 69.6969 formatida kiriting yoki lokatsiya yuboring.");
  }

  const user = await UserModel.findOne({ telegramId: ctx.from?.id });
  if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");

  const updated = await StationModel.findByIdAndUpdate(
    ctx.session.editingStationId,
    { location: { lat, lng } },
    { new: true }
  );

  if (!updated) return ctx.reply("❌ Stansiya joylashuvini yangilab bo'lmadi.");

  ctx.session.step = undefined;
  ctx.session.editingStationId = undefined;

  await ctx.reply(`✅ Shaxobcha joylashuvi (${lat}, ${lng}) ga o'zgartirildi!`, {
    reply_markup: new InlineKeyboard().text("🔙 Orqaga", `user_station_info:${updated._id}`)
  });
}
