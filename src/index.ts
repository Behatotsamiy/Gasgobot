import "dotenv/config";
import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { GrammyError, HttpError, session } from "grammy";
import mongoose from "mongoose";
import { hydrate } from "@grammyjs/hydrate";
import { MyContext, SessionData } from "./types.js";
import { UserModel } from "./Models/User.js";
import { findStation, start, admin } from "./commands/_index.js";
import {
  fuelKeyboard,
  locationKeyboard,
  profileKeyboard,
  backToMenuKeyboard,
  donateKeyboard,
  moneyKeyboard,
  adminKeyboard,
  addStation,
  handleAddStationName,
  handleFuelSelection,
} from "./keyboards/_index.ts";

const Key = process.env.BOT_TOKEN;
const mongo_uri: string = process.env.MONGO_URI;
const broadcastMap = new Map<number, string>();

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

const requestLocationKeyboard = new Keyboard()
  .requestLocation("📍 Joylashuvni yuborish")
  .resized()
  .oneTime();

bot.callbackQuery("profile", profileKeyboard);
bot.callbackQuery("backToMenu", backToMenuKeyboard);
bot.callbackQuery("donate", donateKeyboard);
bot.callbackQuery("money", moneyKeyboard);
bot.callbackQuery("addStationKB", addStation);

// ✅ Broadcast handler FIRST
bot.on("message:text", async (ctx, next) => {
  if (ctx.session.awaitingBroadcast) {
    ctx.session.awaitingBroadcast = false;
    broadcastMap.set(ctx.from.id, ctx.message.text);

    const confirmKeyboard = new InlineKeyboard()
      .text("✅ Confirm", "broadcast_confirm")
      .text("❌ Cancel", "broadcast_cancel");

    await ctx.reply("Do you really want to send this message to all users?\n\n" +
      `"${ctx.message.text}"`, { reply_markup: confirmKeyboard });
  } else {
    return next(); // Let other handlers continue
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
    reply_markup: requestLocationKeyboard,
  });
});

bot.callbackQuery("menu:fuel", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("Yoqilg'ini tanlang!", { reply_markup: fuelKeyboard });
});

bot.callbackQuery("menu:location", async (ctx) => {
  await ctx.deleteMessage();
  const keyboard = new InlineKeyboard()
    .text("✅ Ha", "location:yes")
    .text("⬅️ Ortga", "backToMenu");

  await ctx.reply("📍 Siz joylashuvni o'zgartirmoqchimisiz?", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery("location:yes", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.reply("📍 Yangi joylashuvni yuboring:", {
    reply_markup: requestLocationKeyboard,
  });
});

bot.callbackQuery("admin_stats", async (ctx) => {
  try {
    await mongoose.connect(mongo_uri);

    const total = await UserModel.countDocuments();
    const withPhone = await UserModel.countDocuments({ phone_number: { $exists: true } });
    const withLocation = await UserModel.countDocuments({ location: { $exists: true } });
    const withPhoneNoLocation = await UserModel.countDocuments({
      phone_number: { $exists: true },
      location: { $exists: false },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await UserModel.countDocuments({ createdAt: { $gte: today } });

    const msg = `
📊 Statistika:

👤 Umumiy foydalanuvchilar: ${total}
📞 Telefon raqami bor: ${withPhone}
📍 Lokatsiya berganlar: ${withLocation}
🚫 Faqat telefon, lokatsiyasiz: ${withPhoneNoLocation}
🕒 Bugun qoʻshilganlar: ${todayUsers}
    `.trim();

    const keyboard = new InlineKeyboard().text("⬅️ Back", "admin_panel:back");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(msg, { reply_markup: keyboard });
  } catch (error) {
    console.error("Error in admin_stats:", error);
    await ctx.reply("Statistikani olishda xatolik yuz berdi.");
  }
});

bot.callbackQuery("admin_panel", admin);

bot.callbackQuery(/^admin_users(\?page=(\d+))?$/, async (ctx) => {
  const USERS_PER_PAGE = 5;
  const page = parseInt(ctx.match?.[2] || "0");
  const skip = page * USERS_PER_PAGE;
  const users = await UserModel.find().skip(skip).limit(USERS_PER_PAGE);
  const total = await UserModel.countDocuments();

  if (users.length === 0) {
    await ctx.answerCallbackQuery();
    return ctx.editMessageText("⚠️ No users found.");
  }

  let text = `📋 Users (Page ${page + 1}):\n\n`;
  users.forEach((u, i) => {
    text += `${skip + i + 1}. ID: ${u.telegramId || u.id}\n   Username: @${u.username || "—"}\n   Name: ${u.firstName || "—"}\n\n`;
  });

  const keyboard = new InlineKeyboard();
  if (page > 0) keyboard.text("⏮️ Previous", `admin_users?page=${page - 1}`);
  if ((page + 1) * USERS_PER_PAGE < total) keyboard.text("⏭️ Next", `admin_users?page=${page + 1}`);
  keyboard.row().text("⬅️ Back to Admin Panel", "admin_panel");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, { reply_markup: keyboard });
});

bot.callbackQuery("admin_broadcast", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("📝 Please send the message you want to broadcast to all users.");
  ctx.session.awaitingBroadcast = true;
});

bot.callbackQuery("broadcast_confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();

  const text = broadcastMap.get(ctx.from.id);

  if (!text) {
    console.log("❌ No text found in broadcastMap.");
    return ctx.reply("⚠️ No broadcast message found. Please restart the broadcast.");
  }

  const users = await UserModel.find();
  console.log(`Sending to ${users.length} users`);

  let success = 0, fail = 0;

  for (const user of users) {
    try {
      await ctx.api.sendMessage(user.telegramId, text);
      success++;
    } catch (e) {
      console.log("Failed to send to", user.telegramId, e);
      fail++;
    }
  }

  broadcastMap.delete(ctx.from.id);

  // Show result
  await ctx.reply(`📢 Broadcast finished.\n✅ Sent: ${success}\n❌ Failed: ${fail}`);

  // Show admin panel again
  await admin(ctx);
});


bot.callbackQuery("broadcast_cancel", async (ctx) => {
  await ctx.answerCallbackQuery("Broadcast cancelled");
  await ctx.deleteMessage();
  broadcastMap.delete(ctx.from.id);
});

bot.callbackQuery("admin_panel:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();
  await admin(ctx);
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
