import { StationModel } from "../../Models/Station.js";
import { InlineKeyboard } from "grammy";
function escapeHTML(text = "") {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
// Helper function to notify user about station status
async function notifyUser(ctx, userId, message, stationName, action) {
    try {
        await ctx.api.sendMessage(userId, message, { parse_mode: "HTML" });
        return true;
    }
    catch (error) {
        console.error(`❌ [NOTIFICATION ERROR] Failed to notify user ${userId} about station "${stationName}":`, error);
        return false;
    }
}
// List pending stations
export const adminPendingStations = async (ctx) => {
    try {
        await ctx.deleteMessage().catch(console.error);
        const pendingStations = await StationModel.find({ status: { $in: ["pending", "testing"] } })
            .populate("submittedBy", "telegramId first_name username")
            .sort({ createdAt: -1 })
            .lean();
        if (!pendingStations.length) {
            return ctx.reply("✅ Hozirda ko'rib chiqilmagan stansiyalar yo'q.", {
                reply_markup: new InlineKeyboard().text("🔙 Admin panel", "admin_panel:back"),
            });
        }
        let messageText = `⏳ <b>Ko'rib chiqilmagan yoki test rejimidagi stansiyalar (${pendingStations.length}):</b>\n\n`;
        const keyboard = new InlineKeyboard();
        for (const [i, station] of pendingStations.entries()) {
            const s = station;
            const submitter = s.submittedBy || {
                telegramId: "unknown",
                first_name: "Noma'lum",
                username: "foydalanuvchi_yoq",
            };
            const submittedAt = new Date(s.createdAt).toLocaleString("uz-UZ", {
                timeZone: "Asia/Tashkent",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
            const statusIndicator = s.status === 'testing' ? ' 🧪' : '';
            messageText += `${i + 1}. <b>${escapeHTML(s.name)}</b>${statusIndicator}\n`;
            messageText += `📍 ${s.location.lat}, ${s.location.lng}\n`;
            messageText += `⛽ ${s.fuel_types.join(", ")}\n`;
            messageText += `👤 ${escapeHTML(submitter.first_name)} (@${escapeHTML(submitter.username || "username_yoq")})\n`;
            messageText += `📅 ${submittedAt}\n\n`;
            keyboard.text(`📋 ${i + 1} - ${s.name}`, `pending_review:${s._id}`);
            if ((i + 1) % 2 === 0)
                keyboard.row();
        }
        if (pendingStations.length % 2 !== 0)
            keyboard.row();
        keyboard.text("🔙 Admin panel", "admin_panel:back");
        // Check message length limit for Telegram (4096 characters)
        if (messageText.length > 4000) {
            messageText = messageText.slice(0, 3900) + "...\n\n⚠️ Xabar qisqartirildi!";
        }
        await ctx.reply(messageText, {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
    }
    catch (error) {
        console.error("❌ [ERROR] Error fetching pending stations:", error);
        await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.", {
            reply_markup: new InlineKeyboard().text("🔙 Admin panel", "admin_panel:back"),
        });
    }
};
export const showStationReview = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId) {
        return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
    }
    try {
        const station = await StationModel.findById(stationId).populate("submittedBy", "telegramId first_name username");
        if (!station) {
            return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
        }
        const submitter = station.submittedBy;
        const submittedAt = new Date(station.createdAt).toLocaleString("uz-UZ", {
            timeZone: "Asia/Tashkent",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
        const statusEmoji = station.status === 'pending' ? '⏳' : station.status === 'testing' ? '🧪' : '✅';
        const statusText = station.status === 'pending' ? 'Kutilmoqda' : station.status === 'testing' ? 'Test rejimida' : 'Tasdiqlangan';
        let msg = `<b>🔍 Stansiya ma'lumotlari:</b>\n\n` +
            `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
            `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
            `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
            `👤 <b>Yuboruvchi:</b> ${submitter
                ? `${escapeHTML(submitter.first_name)} (@${escapeHTML(submitter.username || "username_yoq")})`
                : "Noma'lum foydalanuvchi"}\n` +
            `📅 <b>Yuborilgan vaqt:</b> ${submittedAt}\n` +
            `🆔 <b>ID:</b> ${station._id}\n` +
            `📊 <b>Status:</b> ${statusEmoji} ${statusText}\n` +
            `🏢 <b>Ega sifatida yuborilganmi:</b> ${station.isOwnerSubmission ? "Ha" : "Yo'q"}\n\n`;
        let keyboard = new InlineKeyboard();
        // Different options based on status
        if (station.status === 'pending') {
            msg += `<b>Ushbu stansiyani qanday ko'rib chiqasiz?</b>`;
            keyboard
                .text("✅ Tasdiqlash", `approve_station:${stationId}`)
                .text("🧪 Test rejimi", `testing_station:${stationId}`)
                .row()
                .text("❌ Rad etish", `reject_station:${stationId}`)
                .row();
        }
        else if (station.status === 'testing') {
            msg += `<b>Bu stansiya test rejimida. Yakuniy qaror qabul qiling:</b>`;
            keyboard
                .text("✅ To'liq tasdiqlash", `approve_station:${stationId}`)
                .text("❌ Rad etish", `reject_station:${stationId}`)
                .row();
        }
        keyboard
            .text("📍 Xaritada ko'rish", `view_location:${station.location.lat},${station.location.lng}`)
            .row()
            .text("🔙 Orqaga", "admin_pending");
        await ctx.editMessageText(msg, {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
        await ctx.answerCallbackQuery({ text: "Stansiya ma'lumotlari yuklandi" });
    }
    catch (error) {
        console.error("❌ [ERROR] Error showing station review:", error);
        return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
    }
};
// New handler for testing stations review
export const showTestingStationReview = async (ctx) => {
    // Reuse the same logic as showStationReview since it now handles different statuses
    await showStationReview(ctx);
};
// Approve station
export const approveStation = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId) {
        return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
    }
    try {
        const station = await StationModel.findByIdAndUpdate(stationId, {
            status: "approved",
            reviewedAt: new Date()
        }, { new: true }).populate("submittedBy", "telegramId first_name username");
        if (!station) {
            return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
        }
        // Notify the user who submitted the station
        if (station.submittedBy?.telegramId) {
            const notificationMessage = `🎉 <b>Ajoyib xabar!</b>\n\n` +
                `✅ Siz yuborgan stansiya tasdiqlandi:\n` +
                `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
                `📍 <b>Joylashuv:</b> ${station.location.lat}, ${station.location.lng}\n` +
                `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n\n` +
                `Stansiya endi xaritada ko'rsatiladi va boshqa foydalanuvchilar uni ko'rishlari mumkin. Hissangiz uchun rahmat! 🙏`;
            const notificationSent = await notifyUser(ctx, station.submittedBy.telegramId, notificationMessage, station.name, 'approved');
        }
        // Update the admin message
        await ctx.editMessageText(`✅ <b>Stansiya tasdiqlandi!</b>\n\n` +
            `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
            `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
            `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
            `📊 <b>Status:</b> ✅ Tasdiqlangan`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Kutilayotgan stansiyalar", "admin_pending")
                .row()
                .text("🔙 Admin panel", "admin_panel:back"),
            parse_mode: "HTML",
        });
        await ctx.answerCallbackQuery({ text: "Stansiya muvaffaqiyatli tasdiqlandi!" });
    }
    catch (error) {
        console.error("❌ [ERROR] Error approving station:", error);
        return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
    }
};
// Set station to testing status - only for pending stations
export const setStationToTesting = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId) {
        return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
    }
    try {
        const station = await StationModel.findByIdAndUpdate(stationId, {
            status: "testing",
            reviewedAt: new Date()
        }, { new: true }).populate("submittedBy", "telegramId first_name username");
        if (!station) {
            return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
        }
        // Notify the user who submitted the station
        if (station.submittedBy?.telegramId) {
            const notificationMessage = `🧪 <b>Stansiya test rejimiga o'tkazildi!</b>\n\n` +
                `⚡ Siz yuborgan stansiya dastlabki ko'rikdan o'tdi:\n` +
                `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
                `📍 <b>Joylashuv:</b> ${station.location.lat}, ${station.location.lng}\n` +
                `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n\n` +
                `🔍 Stansiya hozir test rejimida - ma'lumotlar tekshirilmoqda va tez orada yakuniy qaror qabul qilinadi.\n` +
                `📞 Agar qo'shimcha ma'lumot kerak bo'lsa, biz siz bilan bog'lanamiz. Sabr qiling! ⏳`;
            const notificationSent = await notifyUser(ctx, station.submittedBy.telegramId, notificationMessage, station.name, 'testing');
        }
        // Update the admin message
        await ctx.editMessageText(`🧪 <b>Stansiya test rejimiga o'tkazildi!</b>\n\n` +
            `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
            `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
            `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
            `📊 <b>Status:</b> 🧪 Test rejimida\n\n` +
            `ℹ️ Stansiya test ro'yxatiga qo'shildi. Ma'lumotlar tekshirilgandan so'ng yakuniy qaror qabul qiling.`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Kutilayotgan stansiyalar", "admin_pending")
                .row()
                .text("🔙 Admin panel", "admin_panel:back"),
            parse_mode: "HTML",
        });
        await ctx.answerCallbackQuery({ text: "Stansiya test rejimiga o'tkazildi!" });
    }
    catch (error) {
        console.error("❌ [ERROR] Error setting station to testing:", error);
        return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
    }
};
// Reject station
export const rejectStation = async (ctx) => {
    const stationId = ctx.callbackQuery?.data?.split(":")[1];
    if (!stationId) {
        console.log(`⚠️ [REJECT] Station ID not found in callback data`);
        return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
    }
    try {
        const station = await StationModel.findById(stationId).populate("submittedBy", "telegramId first_name username");
        if (!station) {
            console.log(`❌ [REJECT] Station not found for ID: ${stationId}`);
            return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
        }
        // Save submitter info before deletion
        const submitter = station.submittedBy;
        await StationModel.findByIdAndDelete(stationId);
        // Notify the user who submitted the station (only for pending stations, not testing)
        if (station.submittedBy?.telegramId && station.status === 'pending') {
            const notificationMessage = `😔 <b>Afsuski...</b>\n\n` +
                `❌ Siz yuborgan stansiya rad etildi:\n` +
                `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
                `📍 <b>Joylashuv:</b> ${station.location.lat}, ${station.location.lng}\n` +
                `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n\n` +
                `Buni sabablari quyidagicha bo'lishi mumkin:\n` +
                `• Ma'lumotlar noto'g'ri yoki aniq emas\n` +
                `• Stansiya mavjud emas yoki yopiq\n` +
                `• Takrorlangan ma'lumot\n\n` +
                `Iltimos, to'g'ri ma'lumotlar bilan qaytadan urinib ko'ring. 📝`;
            const notificationSent = await notifyUser(ctx, station.submittedBy.telegramId, notificationMessage, station.name, 'rejected');
        }
        // Update the admin message
        await ctx.editMessageText(`❌ <b>Stansiya rad etildi!</b>\n\n` +
            `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
            `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
            `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
            `📊 <b>Status:</b> ❌ Rad etilgan`, {
            reply_markup: new InlineKeyboard()
                .text("🔙 Kutilayotgan stansiyalar", "admin_pending")
                .row()
                .text("🔙 Admin panel", "admin_panel:back"),
            parse_mode: "HTML",
        });
        await ctx.answerCallbackQuery({ text: "Stansiya rad etildi!" });
    }
    catch (error) {
        console.error("❌ [ERROR] Error rejecting station:", error);
        return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
    }
};
// View station location on map
export const viewStationLocation = async (ctx) => {
    const locationData = ctx.callbackQuery?.data?.split(":")[1];
    if (!locationData) {
        return ctx.answerCallbackQuery({ text: "Koordinatalar topilmadi", show_alert: true });
    }
    try {
        const [lat, lng] = locationData.split(",");
        if (!lat || !lng) {
            return ctx.answerCallbackQuery({ text: "Noto'g'ri koordinatalar", show_alert: true });
        }
        // Send location
        await ctx.replyWithLocation(parseFloat(lat), parseFloat(lng));
        await ctx.answerCallbackQuery({ text: "Joylashuv yuborildi!" });
    }
    catch (error) {
        console.error("❌ [ERROR] Error sending location:", error);
        return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
    }
};
