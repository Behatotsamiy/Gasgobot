import "dotenv/config";
import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { GrammyError, HttpError, session } from "grammy";
import mongoose from "mongoose";
import { hydrate } from "@grammyjs/hydrate";
import { MyContext, SessionData } from "./types.js";
import { UserModel } from "./Models/User.js";
import { findStation, start, admin } from "./commands/_index.js";
import {
  locationKeyboard,
  handleAddStationName,
  handleFuelSelection,
} from "./keyboards/_index.ts";
import { HandleCallbackQuery } from "./handlers/callbackHandlers.ts";
import { broadcastMap } from "./utils/broadcastMap.ts"; // adjust path based on location


const Key = process.env.BOT_TOKEN;
const mongo_uri: string = process.env.MONGO_URI;

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

bot.on("message:location", locationKeyboard);

// registration (one line)
bot.on("callback_query:data", HandleCallbackQuery);

// ✅ Broadcast handler FIRST
bot.on("message", async (ctx) => {
  if (ctx.session.awaitingBroadcast) {
    const text = ctx.message?.text;

    if (!text) return ctx.reply("❌ Only text messages are supported.");

    broadcastMap.set(ctx.from.id, text);
    ctx.session.awaitingBroadcast = false;
    console.log(broadcastMap);
    
    const confirmKeyboard = new InlineKeyboard()
      .text("✅ Confirm", "broadcast_confirm")
      .text("❌ Cancel", "broadcast_cancel");

    await ctx.reply(`You entered:\n\n${text}\n\nConfirm broadcast?`, {
      reply_markup: confirmKeyboard,
    });
  }
});


bot.on("message:text", handleAddStationName);

bot.callbackQuery(/^fuel/, async (ctx) => {
  if (ctx.session.step === "fuel") {
    await handleFuelSelection(ctx);
  } else {
    await findStation(ctx);
  }
});

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
  await ctx.reply("Endi iltimos, joylashuvingizni yuboring:", {
    reply_markup: locationKeyboard,
  });
});

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
