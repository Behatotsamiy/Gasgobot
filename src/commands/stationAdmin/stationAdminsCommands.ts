import { MyContext } from "../../types.ts";
import { UserModel } from "../../Models/User.ts";
import { StationModel } from "../../Models/Station.ts";
import { addStation } from "../../keyboards/addStation.ts";
import { InlineKeyboard } from "grammy";
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.ts";
import { StaitonShort, Stationlong, editStation } from "../../keyboards/manageStations.ts";

export async function stationInfo(ctx: MyContext, specificStation?: StationDocument) {
  if ("callback_query" in ctx.update) {
    await ctx.answerCallbackQuery();
  }

  ctx.session.prevMenu = "station_menu";

  if (specificStation) {
    await StaitonShort(specificStation.name, specificStation._id, ctx);
    ctx.session.step = "add_another_station";
    return wantTo_AddStantion(ctx);
  }

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });
  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const stations = await StationModel.find({ owner: user._id });
  if (stations.length < 1) {
    try {
      await ctx.deleteMessage();
    } catch (_) {}

    ctx.session.step = "confirm_add_station";
    return wantTo_AddStantion(ctx);
  }

  for (const station of stations) {
    await StaitonShort(station.name, station._id, ctx);
  }

  ctx.session.step = "add_another_station";
  return wantTo_AddStantion(ctx);
}



export const userStationInfo = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  const station = await StationModel.findById(stationId);
  if (!station) {
    try {
      await ctx.deleteMessage();
    } catch (_) {}
    return ctx.reply("❌ Stansiya topilmadi");
  }
  return Stationlong(station , ctx);
};

export const stationChange = async (ctx: MyContext) => {
  const call = ctx.callbackQuery?.data?.split(":")[0];
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  try {
    await ctx.deleteMessage();
  } catch (_) {}

  const station = await StationModel.findById(stationId);
  if (!station) {
    return ctx.reply("❌ Stansiya topilmadi");
  }
  return editStation(ctx , station._id , call);
};

export const deleteStation = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  const station = await StationModel.findById(stationId);
  if (!station) return ctx.reply("❌ Stansiya topilmadi");

  await station.deleteOne();
  try {
    await ctx.editMessageText("✅ Stansiya o'chirildi");
  } catch (_) {}

  return stationInfo(ctx);
};

export const pricelist = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();
  ctx.session.selectedStationIds = [];

  try {
    await ctx.deleteMessage();
  } catch (_) {}

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });

  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const stations = await StationModel.find({ owner: user._id });

  if (stations.length < 1) {
    try {
      await ctx.deleteMessage();
    } catch (_) {}
    return wantTo_AddStantion(ctx);
  }

  const keyboard = new InlineKeyboard()
    .text("Narx belgilash", `change_prices`)
    .row()
    .text("Hozirgi narxlar", `view_prices`)
    .row()
    .text("⬅️ Ortga", "station_admin");

  return ctx.reply("Quyidagilardan birini tanlang", { reply_markup: keyboard });
};


export const toggleStation = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  if (!stationId) return;

  const selected = ctx.session.selectedStationIds || [];
  const index = selected.indexOf(stationId);

  if (index === -1) selected.push(stationId);
  else selected.splice(index, 1);

  ctx.session.selectedStationIds = selected;

  return changePrice(ctx);
};

export const changePrice = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });

  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const stations = await StationModel.find({ owner: user._id });

  const selectedIds = ctx.session.selectedStationIds || [];

  const keyboard = new InlineKeyboard();
  for (const station of stations) {
    const selected = selectedIds.includes(station._id.toString());
    keyboard.text(`${selected ? "✅ " : ""}${station.name}`, `toggle_station:${station._id}`).row();
  }

  if (selectedIds.length > 0) {
    keyboard.text("✅ Davom etish", "confirm_station_selection").row();
  }

  keyboard.text("⬅️ Ortga", "pricelist");

  return ctx.editMessageText("Stansiyalarni tanlang (✅ - tanlangan)", {
    reply_markup: keyboard,
  });
};

export const confirmStationSelection = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });
  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const selectedIds = ctx.session.selectedStationIds || [];
  const stations = await StationModel.find({ _id: { $in: selectedIds } });

  const fuelSet = new Set<string>();
  stations.forEach((s) => s.fuel_types.forEach((f) => fuelSet.add(f)));

  const fuelInstructions = Array.from(fuelSet).map((fuel) => `⛽ ${fuel}: 12345`).join("\n");

  ctx.session.step = "setting_price";

  await ctx.reply(`Iltimos, har bir yoqilg'i turiga narxni kiriting:\n\n${fuelInstructions}`);
};

export const currentPrices = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  const keyboard = new InlineKeyboard()
    .text("🧾 Mening narxlarim", "my_prices")
    .row()
    .text("📊 Raqobatchilar narxlari", "competitor_prices")
    .row()
    .text("⬅️ Ortga", "pricelist");

  return ctx.editMessageText("Qaysi narxlarni ko'rmoqchisiz?", {
    reply_markup: keyboard,
  });
};

export const handleMyPrices = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  try {
    await ctx.deleteMessage();
  } catch (_) {}

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });
  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const stations = await StationModel.find({ owner: user._id });

  if (stations.length === 0) {
    ctx.session.wantTo_AddStation = true;
    const keyboard = new InlineKeyboard().text("⬅️ Ortga", "view_prices");
    return ctx.reply("❌ Sizda stansiyalar mavjud emas.", {
      reply_markup: keyboard,
    });
  }

  let msg = "";

  for (const station of stations) {
    msg += `⛽ *${station.name}* narxlari:\n`;
    for (const fuel of station.fuel_types) {
      const price = station.pricing instanceof Map ? station.pricing.get(fuel) : null;
      msg += `• ${fuel}: ${price ? `${price.toLocaleString()} so'm` : "yo'q"}\n`;
    }
    msg += "\n";
  }

  const keyboard = new InlineKeyboard().text("⬅️ Ortga", "view_prices");

  return ctx.reply(msg.trim(), {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
};

export const handleCompetitorPrices = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery();

  try {
    await ctx.deleteMessage();
  } catch (_) {}

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });
  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const competitors = await StationModel.find({ owner: { $ne: user._id } });

  const keyboard = new InlineKeyboard().text("⬅️ Ortga", "view_prices");

  if (competitors.length === 0) {
    return ctx.reply("❌ Raqobatchi stansiyalar topilmadi.", {
      reply_markup: keyboard,
    });
  }

  const fuelPrices: Record<string, number[]> = {};

  for (const station of competitors) {
    if (!station.pricing) continue;
    for (const fuel of station.fuel_types) {
      const price = station.pricing[fuel];
      if (typeof price === "number") {
        if (!fuelPrices[fuel]) fuelPrices[fuel] = [];
        fuelPrices[fuel].push(price);
      }
    }
  }

  if (Object.keys(fuelPrices).length === 0) {
    return ctx.reply("🚫 Hech qanday ma'lumot yo'q.", {
      reply_markup: keyboard,
    });
  }

  let msg = `📊 *Raqobatchilar narxlari (eng past/eng yuqori):*\n\n`;

  for (const [fuel, prices] of Object.entries(fuelPrices)) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    msg += `⛽ ${fuel}:\n`;
    msg += `   • Eng past: ${min.toLocaleString()} so'm\n`;
    msg += `   • Eng yuqori: ${max.toLocaleString()} so'm\n\n`;
  }

  return ctx.reply(msg.trim(), {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
};

export const gasInfo = async (ctx: MyContext) => {
  // Placeholder
};

export const workTime = async (ctx: MyContext) => {
  // Placeholder
};
