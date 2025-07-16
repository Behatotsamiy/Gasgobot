import "dotenv/config";
import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { GrammyError, HttpError, session, SessionFlavor } from "grammy";
import { UserModel } from "./Models/User.js";
import mongoose from "mongoose";
import { hydrate } from "@grammyjs/hydrate";
import { MyContext, SessionData } from "./types.js";
import { findStation, start } from "./commands/_index.js";
import {
  fuelKeyboard,
  locationKeyboard,
  profileKeyboard,
  backToMenuKeyboard,
  donateKeyboard,
  moneyKeyboard,
  addStation,
  handleAddStationName,
  handleFuelSelection,
} from "./keyboards/_index.js";
import { callbackify } from "util";

const Key = process.env.BOT_TOKEN;
if (!Key) {
  throw new Error("BOT_TOKEN is not defined in .env file");
}

const bot = new Bot<MyContext>(Key);
bot.use(
  session({
    initial: (): SessionData => ({
      step: undefined,
      station: { name: "", fuel_types: [] },
    }),
  })
);
bot.use(hydrate());

bot.command("start", start);

bot.on("message:location", async (ctx) => {
  // Remove the reply keyboard
  await ctx.reply("✅ Lokatsiya saqlandi!", {
    reply_markup: { remove_keyboard: true },
  });

  await ctx.reply("Benzin turini tanlang:", {
    reply_markup: fuelKeyboard, // This should be an InlineKeyboard
  });
});

const requestLocationKeyboard = new Keyboard()
  .requestLocation("📍 Joylashuvni yuborish")
  .resized()
  .oneTime(); // hides after pressing


bot.callbackQuery("profile", profileKeyboard);

bot.callbackQuery("backToMenu", backToMenuKeyboard);

bot.callbackQuery("donate", donateKeyboard);

bot.callbackQuery("money", moneyKeyboard);

bot.callbackQuery("addStationKB", addStation);

bot.on("message:text", handleAddStationName);



 bot.callbackQuery(/^fuel/, async (ctx) => {
  if (ctx.session.step === "fuel") {
    // Это добавление заправки
    await handleFuelSelection(ctx);
  } else {
    // Это поиск
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
    reply_markup: requestLocationKeyboard,
  });
});

bot.callbackQuery("menu:fuel", async (ctx) => {
  try {
    await ctx.deleteMessage(); // Deletes the previous nearest station message
    await ctx.reply("Yoqilg'ini tanlang!", { reply_markup: fuelKeyboard });
  } catch (err) {
    console.error("❌ Menuga qaytishda xatolik", err);
  }
});
bot.callbackQuery("menu:location", async (ctx) => {
  try {
    await ctx.deleteMessage();

    const keyboard = new InlineKeyboard()
      .text("✅ Ha", "location:yes")
      .text("⬅️ Ortga", "backToMenu");

    await ctx.reply("📍 Siz joylashuvni o'zgartirmoqchimisiz?", {
      reply_markup: keyboard,
    });

  } catch (err) {
    console.error("❌ Location menu error:", err);
  }
});
bot.callbackQuery("location:yes", async (ctx) => {
  try {
    await ctx.deleteMessage();

    await ctx.reply("📍 Yangi joylashuvni yuboring:", {
      reply_markup: requestLocationKeyboard,
    });

  } catch (err) {
    console.error("❌ Location:yes error:", err);
  }
});

// Обработка ошибок согласно документации


bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;

  console.error(`❗ Xatolik update_id=${ctx.update.update_id}:`);

  if (e instanceof GrammyError) {
    console.error(`Telegram error [${e.error_code}]: ${e.description}`);
    if (e.error_code === 403) {
      console.warn("➡️ Bot was blocked by the user.");
    }
  } else if (e instanceof HttpError) {
    console.error("🌐 Network error:", e);
  } else {
    console.error("❓ Unknown error:", e);
  }
});
// Функция запуска бота
async function startBot() {
  try {
    await mongoose.connect(
      "mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Mongo connected");
    console.log("Mongoose connection state:", mongoose.connection.readyState);

    await bot.start();
    console.log("Bot started");

  } catch (error) {
    console.error("Error in startBot:", error);
  }
}

startBot();
