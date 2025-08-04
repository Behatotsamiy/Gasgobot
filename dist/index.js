import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";
import { GrammyError, HttpError, session } from "grammy";
import mongoose from "mongoose";
import { hydrate } from "@grammyjs/hydrate";
import { UserModel } from "./Models/User.js";
import { start, admin } from "./commands/_index.js";
import { HandleCallbackQuery } from "./handlers/callbackHandlers.js";
import { broadcastMap } from "./utils/broadcastMap.js";
import { Station_Admin } from "./commands/stationAdmin/stationAdmin.js";
import { handleAddStationName, handleStationLocation, } from "./keyboards/addStation.js";
import { StationModel } from "./Models/Station.js";
import { handleFuelPriceInput, stationInfo, } from "./commands/stationAdmin/stationAdminsCommands.js";
import { FeedbackModel } from "./Models/Feedback.js";
import { ADMINS } from "./utils/requireAdmin.js";
import { donateKeyboard } from "./keyboards/help.js";
import express from "express";
import { handleLocationSharing } from "./handlers/handleLocation.js";
dotenv.config();
const Key = process.env.BOT_TOKEN;
const mongo_uri = `mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
if (!Key)
    throw new Error("BOT_TOKEN is not defined in .env file");
if (!mongo_uri)
    throw new Error("MONGO_URI is not defined in .env file");
const bot = new Bot(Key);
bot.use(session({
    initial: () => ({
        step: undefined,
        station: { name: "", fuel_types: [], location: { lat: 0, lng: 0 } },
        awaitingBroadcast: false,
        broadcastPreview: "",
    }),
}));
bot.use(hydrate());
bot.command("start", start);
bot.command("admin", admin);
bot.command("ishla", Station_Admin);
bot.on("message:location", async (ctx) => {
    if (ctx.session.step === "location") {
        const handled = await handleStationLocation(ctx);
        if (handled)
            return;
    }
    return handleLocationSharing(ctx);
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
    // NEW: Handle individual fuel price input
    if (ctx.session.step === "setting_price") {
        return handleFuelPriceInput(ctx, ctx.message.text);
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
        return stationInfo(ctx);
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
                lng: lng,
            };
            await station.save();
            ctx.session.step = undefined;
            ctx.session.editingStationId = undefined;
            await ctx.reply("✅ Joylashuv muvaffaqiyatli yangilandi.");
            return stationInfo(ctx);
        }
        catch (error) {
            console.error("Error updating station location:", error);
            return ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
        }
    }
    if (ctx.session.step === "awaiting_feedback") {
        const feedbackText = ctx.message.text.trim();
        if (!feedbackText) {
            return ctx.reply("❌ Fikr bo'sh bo'lmasligi kerak.");
        }
        const user = await UserModel.findOne({ telegramId: ctx.from?.id });
        if (!user) {
            ctx.session.step = undefined;
            return ctx.reply("❌ Foydalanuvchi topilmadi.");
        }
        const lastFeedback = await FeedbackModel.findOne({ user: user._id }).sort({
            createdAt: -1,
        });
        const now = new Date();
        const isAdmin = ADMINS.includes(user.telegramId);
        if (!isAdmin &&
            lastFeedback &&
            now.getTime() - lastFeedback.createdAt.getTime() < 10 * 60 * 1000) {
            ctx.session.step = undefined;
            return ctx.reply("🚫 Siz faqat har 10 daqiqada bir marta fikr yuborishingiz mumkin.");
        }
        await FeedbackModel.create({
            user: user._id,
            message: feedbackText,
        });
        for (const adminId of ADMINS) {
            if (adminId === user.telegramId)
                continue;
            try {
                await ctx.api.sendMessage(adminId, `📩 Yangi fikr:\n\n👤 @${ctx.from?.username || "no-username"} (${ctx.from?.id})\n\n"${feedbackText}"`);
            }
            catch (err) {
                return console.error(`❗ Admin ${adminId}ga yuborib bo'lmadi`);
            }
        }
        ctx.session.step = undefined;
        await ctx.reply("✅ Fikringiz uchun rahmat! Adminlarimiz ko'rib chiqadi.");
        return donateKeyboard(ctx);
    }
    await next();
});
// 🏷 Add station name
bot.on("message:text", handleAddStationName);
// ☎️ Contact handler
bot.on("message:contact", async (ctx) => {
    const telegramId = ctx.from?.id;
    const phone = ctx.message.contact?.phone_number;
    if (!phone)
        return;
    await UserModel.findOneAndUpdate({ telegramId }, { phone_number: phone }, { upsert: true });
    await ctx.reply("✅ Telefon raqamingiz saqlandi!");
    return handleLocationSharing(ctx);
});
// 🚨 Error logging
bot.catch((err) => {
    const ctx = err.ctx;
    const e = err.error;
    console.error(`❗ Xatolik update_id=${ctx.update.update_id}:`);
    if (e instanceof GrammyError) {
        console.error(`Telegram error [${e.error_code}]: ${e.description}`);
        if (e.error_code === 403)
            console.warn("➡️ Bot was blocked by the user.");
    }
    else if (e instanceof HttpError) {
        console.error("🌐 Network error:", e);
    }
    else {
        console.error("❓ Unknown error:", e);
    }
});
const app = express();
app.use(bodyParser.json());
app.post("/webhook", async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
    }
    catch (err) {
        console.error("❌ Error handling update:", err);
        res.sendStatus(500);
    }
});
app.get("/", (_, res) => {
    res.send("Bot is running (webhook mode)");
});
async function startBot() {
    try {
        await mongoose.connect(mongo_uri);
        console.log("Mongo connected");
        await bot.init(); // REQUIRED for webhook mode
        const webhookUrl = process.env.WEBHOOK_URL;
        if (!webhookUrl)
            throw new Error("WEBHOOK_URL not set");
        await bot.api.setWebhook(`${webhookUrl}/webhook`);
        console.log("✅ Webhook set:", `${webhookUrl}/webhook`);
        const port = Number(process.env.PORT) || 3000;
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error("Error in startBot:", error);
    }
}
setInterval(async () => {
    const now = new Date();
    await StationModel.updateMany({ "busyness.expiresAt": { $lte: now } }, {
        $set: {
            "busyness.level": undefined,
            "busyness.expiresAt": undefined,
        },
    });
}, 5 * 60 * 1000); // every 5 minutes
startBot();
