import "dotenv/config";
import { Bot, Keyboard } from "grammy";
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

bot.on("message:location", locationKeyboard);

bot.callbackQuery("profile", profileKeyboard);

bot.callbackQuery("backToMenu", backToMenuKeyboard);

bot.callbackQuery("donate", donateKeyboard);

bot.callbackQuery("money", moneyKeyboard);

bot.callbackQuery("addStationKB", addStation);

bot.on("message:text", handleAddStationName);



 bot.callbackQuery(/^fuel:.+$/, async (ctx) => {
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

  // После номера — запрашиваем локацию
  const locationKeyboard = new Keyboard()
    .requestLocation("📍 Joylashuvni yuborish")
    .resized()
    .oneTime();

  await ctx.reply("✅ Telefon raqamingiz saqlandi!");
  await ctx.reply("Endi iltimos, joylashuvingizni yuboring:", {
    reply_markup: locationKeyboard,
  });
});

// Обработка ошибок согласно документации
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Функция запуска бота
async function startBot() {
  try {
    await mongoose.connect(
      "mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    bot.start();
    console.log("Mongo connected and Bot started");
  } catch (error) {
    console.error("Error in startBot:", error);
  }
}

startBot();
