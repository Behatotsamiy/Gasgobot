import dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";
import { GrammyError, HttpError, session } from "grammy";
import mongoose from "mongoose";
import { hydrate } from "@grammyjs/hydrate";
import { MyContext, SessionData } from "./types.js";
import { UserModel } from "./Models/User.js";
import { findStation, start, admin } from "./commands/_index.js";
import {
  locationKeyboard,
  sendLocationRequestKeyboard,
} from "./commands/location.ts";
import { HandleCallbackQuery } from "./handlers/callbackHandlers.ts";
import { broadcastMap } from "./utils/broadcastMap.ts";
import { Station_Admin } from "./commands/stationAdmin/stationAdmin.ts";
import { handleAddStationName, handleStationCallbacks, handleStationLocation } from "./keyboards/addStation.ts"
import { parsePrices } from "./utils/parsePrice.ts";
import { StationModel } from "./Models/Station.ts";
import { stationAdmin_Keyboard } from "./keyboards/stationAdminKeyboard.ts";
import { stationInfo } from "./commands/stationAdmin/stationAdminsCommands.ts";

dotenv.config();
const Key = process.env.BOT_TOKEN;
const mongo_uri: string =`mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

if (!Key) throw new Error("BOT_TOKEN is not defined in .env file");
if (!mongo_uri) throw new Error("MONGO_URI is not defined in .env file");

const bot = new Bot<MyContext>(Key);

bot.use(
  session({
    initial: (): SessionData => ({
      step: undefined,
      station: { name: "", fuel_types: [] },
      awaitingBroadcast: false,
      broadcastPreview: "",
    }),
  })
);

bot.use(hydrate());

bot.command("start", start);
bot.command("admin", admin);
bot.command("ishla", Station_Admin);

bot.on("message:location", async (ctx) => {
  if (ctx.session.step === "location") {
    const handled = await handleStationLocation(ctx);
    if (handled) return; 
  }

  return locationKeyboard(ctx);
});

bot.on("callback_query:data", HandleCallbackQuery);
bot.on("message:text", async (ctx, next) => {
  const userId = ctx.from?.id;

  if (ctx.session.awaitingBroadcast) {
    const text = ctx.message.text;
    broadcastMap.set(userId, text);
    ctx.session.awaitingBroadcast = false;

    const confirmKeyboard = new InlineKeyboard()
      .text("✅ Confirm", "broadcast_confirm")
      .text("❌ Cancel", "broadcast_cancel");

    await ctx.reply(`You entered:\n\n${text}\n\nConfirm broadcast?`, {
      reply_markup: confirmKeyboard,
    });
    return;
  }

  if (ctx.session.step === "setting_price") {
    const text = ctx.message.text;
    const parsed = parsePrices(text);

    if (Object.keys(parsed).length === 0) {
      return ctx.reply("❌ Format noto'g'ri. Har bir qatorda: `Ai-92: 12300` bo'lishi kerak.");
    }

    ctx.session.broadcastPreview = JSON.stringify(parsed);
    ctx.session.step = "confirm_price_save";

    const keyboard = new InlineKeyboard()
      .text("✅ Saqlash", "confirm_price_save")
      .text("❌ Bekor qilish", "cancel_price_save");

    return ctx.reply(
      `Siz kiritgan narxlar:\n\n${Object.entries(parsed)
        .map(([fuel, price]) => `⛽ ${fuel}: ${Number(price).toLocaleString()} so'm`)
        .join("\n")}\n\nTasdiqlaysizmi?`,
      { reply_markup: keyboard }
    );
  }

  if (ctx.session.step === "station_name_change") {
    const newName = ctx.message.text;
    const station = await StationModel.findById(ctx.session.editingStationId);

    if (!station) {
      ctx.session.step = undefined;
      ctx.session.editingStationId = undefined;
      return ctx.reply("❌ Stansiya topilmadi.");
    }

    station.name = newName;
    await station.save();

    ctx.session.step = undefined;
    ctx.session.editingStationId = undefined;

    await ctx.reply("✅ Shaxobcha nomi muvaffaqiyatli yangilandi.");
    return stationInfo(ctx, station);
  }

  if (ctx.session.step === "station_location_change") {
    const text = ctx.message.text.trim();
    const match = text.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);

    if (!match) {
        return ctx.reply("❌ Format noto'g'ri. Misol: `42.4242, 69.6969`");
    }

    const [, latStr, lngStr] = match;
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
        return ctx.reply("❌ Noto'g'ri koordinatalar. Qayta kiriting.");
    }

    try {
        const station = await StationModel.findById(ctx.session.editingStationId);

        if (!station) {
            ctx.session.step = undefined;
            ctx.session.editingStationId = undefined;
            return ctx.reply("❌ Stansiya topilmadi.");
        }

        // Ensure both lat and lng are provided
        station.location = { 
            lat: lat, 
            lng: lng 
        };
        
        await station.save();

        ctx.session.step = undefined;
        ctx.session.editingStationId = undefined;

        await ctx.reply("✅ Joylashuv muvaffaqiyatli yangilandi.");
        return stationInfo(ctx, station);

    } catch (error) {
        console.error("Error updating station location:", error);
        return ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
    }
}
  await next();
});




// 🏷 Add station name
bot.on("message:text", handleAddStationName);

// ☎️ Contact handler
bot.on("message:contact", async (ctx) => {
  const telegramId = ctx.from.id;
  const phone = ctx.message.contact?.phone_number;
  if (!phone) return;

  await UserModel.findOneAndUpdate(
    { telegramId },
    { phone_number: phone },
    { upsert: true }
  );

  await ctx.reply("✅ Telefon raqamingiz saqlandi!");
  await sendLocationRequestKeyboard(ctx); // → prompt for location
});

// 🚨 Error logging
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;
  console.error(`❗ Xatolik update_id=${ctx.update.update_id}:`);

  if (e instanceof GrammyError) {
    console.error(`Telegram error [${e.error_code}]: ${e.description}`);
    if (e.error_code === 403) console.warn("➡️ Bot was blocked by the user.");
  } else if (e instanceof HttpError) {
    console.error("🌐 Network error:", e);
  } else {
    console.error("❓ Unknown error:", e);
  }
});

async function startBot() {
  try {
    await mongoose.connect(mongo_uri);
    console.log("Mongo connected");
    console.log("Mongoose connection state:", mongoose.connection.readyState);
    await bot.start();
  } catch (error) {
    console.error("Error in startBot:", error);
  }
}

startBot();