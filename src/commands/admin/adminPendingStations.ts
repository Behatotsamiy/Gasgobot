import { MyContext } from "../../types.js";
import { StationModel } from "../../Models/Station.js";
import { UserModel } from "../../Models/User.js";
import { InlineKeyboard } from "grammy";

interface Submitter {
  telegramId: string;
  first_name?: string;
  username?: string;
}

function escapeHTML(text: string = ""): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Helper function to notify user about station status
async function notifyUser(ctx: MyContext, userId: string, message: string, stationName: string, action: 'approved' | 'rejected') {
  try {
    await ctx.api.sendMessage(userId, message, { parse_mode: "HTML" });
    return true;
  } catch (error) {
    console.error(`❌ [NOTIFICATION ERROR] Failed to notify user ${userId} about station "${stationName}":`, error);
    return false;
  }
}

// List pending stations
export const adminPendingStations = async (ctx: MyContext) => {  
  try {
    await ctx.deleteMessage().catch(console.error);

    const pendingStations = await StationModel.find({ status: "pending" })
      .populate<{ submittedBy: Submitter }>("submittedBy", "telegramId first_name username")
      .sort({ createdAt: -1 })
      .lean();

    if (!pendingStations.length) {
      return ctx.reply("✅ Hozirda ko'rib chiqilmagan stansiyalar yo'q.", {
        reply_markup: new InlineKeyboard().text("🔙 Admin panel", "admin_panel:back"),
      });
    }

    let messageText = `⏳ <b>Ko'rib chiqilmagan stansiyalar (${pendingStations.length}):</b>\n\n`;
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

      messageText += `${i + 1}. <b>${escapeHTML(s.name)}</b>\n`;
      messageText += `📍 ${s.location.lat}, ${s.location.lng}\n`;
      messageText += `⛽ ${s.fuel_types.join(", ")}\n`;
      messageText += `👤 ${escapeHTML(submitter.first_name)} (@${escapeHTML(submitter.username || "username_yoq")})\n`;
      messageText += `📅 ${submittedAt}\n\n`;

      keyboard.text(`📋 ${i + 1} - ${s.name}`, `pending_review:${s._id}`);
      if ((i + 1) % 2 === 0) keyboard.row();
    }

    if (pendingStations.length % 2 !== 0) keyboard.row();
    keyboard.text("🔙 Admin panel", "admin_panel:back");

    // Check message length limit for Telegram (4096 characters)
    if (messageText.length > 4000) {
      messageText = messageText.slice(0, 3900) + "...\n\n⚠️ Xabar qisqartirildi!";
    }

    await ctx.reply(messageText, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("❌ [ERROR] Error fetching pending stations:", error);
    await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.", {
      reply_markup: new InlineKeyboard().text("🔙 Admin panel", "admin_panel:back"),
    });
  }
};

export const showStationReview = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  
  if (!stationId) {
    return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
  }

  try {
    const station = await StationModel.findById(stationId).populate<{ submittedBy: Submitter }>(
      "submittedBy",
      "telegramId first_name username"
    );

    if (!station || !station.submittedBy) {
      return ctx.answerCallbackQuery({ text: "Stansiya yoki yuboruvchi topilmadi", show_alert: true });
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

    const msg =
      `<b>🔍 Stansiya ma'lumotlari:</b>\n\n` +
      `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
      `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
      `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
      `👤 <b>Yuboruvchi:</b> ${escapeHTML(submitter.first_name)} (@${escapeHTML(submitter.username || "username_yoq")})\n` +
      `📅 <b>Yuborilgan vaqt:</b> ${submittedAt}\n` +
      `🆔 <b>ID:</b> ${station._id}\n` +
      `📊 <b>Status:</b> ${station.status}\n` +
      `🏢 <b>Ega sifatida yuborilganmi:</b> ${station.isOwnerSubmission ? "Ha" : "Yo'q"}\n\n` +
      `<b>Ushbu stansiyani tasdiqlaysizmi?</b>`;

    const keyboard = new InlineKeyboard()
      .text("✅ Tasdiqlash", `approve_station:${stationId}`)
      .text("❌ Rad etish", `reject_station:${stationId}`)
      .row()
      .text("📍 Xaritada ko'rish", `view_location:${station.location.lat},${station.location.lng}`)
      .row()
      .text("🔙 Orqaga", "admin_pending");

    await ctx.editMessageText(msg, { reply_markup: keyboard, parse_mode: "HTML" });
    await ctx.answerCallbackQuery({ text: "Stansiya ma'lumotlari yuklandi" });

  } catch (error) {
    console.error("❌ [ERROR] Error showing station review:", error);
    return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
  }
};

// Approve station
export const approveStation = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  
  if (!stationId) {
    return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
  }

  try {
    
    const station = await StationModel.findByIdAndUpdate(
      stationId,
      { status: "approved" },
      { new: true }
    ).populate<{ submittedBy: Submitter }>("submittedBy", "telegramId first_name username");

    if (!station) {
      return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
    }

    // Notify the user who submitted the station
    if (station.submittedBy?.telegramId) {
      
      const notificationMessage = 
        `🎉 <b>Ajoyib xabar!</b>\n\n` +
        `✅ Siz yuborgan stansiya tasdiqlandi:\n` +
        `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
        `📍 <b>Joylashuv:</b> ${station.location.lat}, ${station.location.lng}\n` +
        `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n\n` +
        `Stansiya endi xaritada ko'rsatiladi va boshqa foydalanuvchilar uni ko'rishlari mumkin. Hissangiz uchun rahmat! 🙏`;

      const notificationSent = await notifyUser(
        ctx, 
        station.submittedBy.telegramId, 
        notificationMessage, 
        station.name, 
        'approved'
      );
    } 
    // Update the admin message
    await ctx.editMessageText(
      `✅ <b>Stansiya tasdiqlandi!</b>\n\n` +
      `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
      `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
      `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
      `📊 <b>Status:</b> Tasdiqlangan`,
      {
        reply_markup: new InlineKeyboard()
          .text("🔙 Kutilayotgan stansiyalar", "admin_pending")
          .row()
          .text("🔙 Admin panel", "admin_panel:back"),
        parse_mode: "HTML",
      }
    );

    await ctx.answerCallbackQuery({ text: "Stansiya muvaffaqiyatli tasdiqlandi!" });
    
  } catch (error) {
    console.error("❌ [ERROR] Error approving station:", error);
    return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
  }
};

// Reject station
export const rejectStation = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  
  if (!stationId) {
    console.log(`⚠️ [REJECT] Station ID not found in callback data`);
    return ctx.answerCallbackQuery({ text: "Stansiya ID topilmadi", show_alert: true });
  }

  try {
    
    const station = await StationModel.findByIdAndUpdate(
      stationId,
      { status: "rejected" },
      { new: true }
    ).populate<{ submittedBy: Submitter }>("submittedBy", "telegramId first_name username");

    if (!station) {
      console.log(`❌ [REJECT] Station not found for ID: ${stationId}`);
      return ctx.answerCallbackQuery({ text: "Stansiya topilmadi", show_alert: true });
    }

    // Notify the user who submitted the station
    if (station.submittedBy?.telegramId) {

      const notificationMessage = 
        `😔 <b>Afsuski...</b>\n\n` +
        `❌ Siz yuborgan stansiya rad etildi:\n` +
        `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
        `📍 <b>Joylashuv:</b> ${station.location.lat}, ${station.location.lng}\n` +
        `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n\n` +
        `Buni sabablari quyidagicha bo'lishi mumkin:\n` +
        `• Ma'lumotlar noto'g'ri yoki aniq emas\n` +
        `• Stansiya mavjud emas yoki yopiq\n` +
        `• Takrorlangan ma'lumot\n\n` +
        `Iltimos, to'g'ri ma'lumotlar bilan qaytadan urinib ko'ring. 📝`;

      const notificationSent = await notifyUser(
        ctx, 
        station.submittedBy.telegramId, 
        notificationMessage, 
        station.name, 
        'rejected'
      );

    } 

    // Update the admin message
    await ctx.editMessageText(
      `❌ <b>Stansiya rad etildi!</b>\n\n` +
      `🏷️ <b>Nomi:</b> ${escapeHTML(station.name)}\n` +
      `⛽ <b>Yonilg'i turlari:</b> ${station.fuel_types.join(", ")}\n` +
      `📍 <b>Koordinatalar:</b> ${station.location.lat}, ${station.location.lng}\n` +
      `📊 <b>Status:</b> Rad etilgan`,
      {
        reply_markup: new InlineKeyboard()
          .text("🔙 Kutilayotgan stansiyalar", "admin_pending")
          .row()
          .text("🔙 Admin panel", "admin_panel:back"),
        parse_mode: "HTML",
      }
    );

    await ctx.answerCallbackQuery({ text: "Stansiya rad etildi!" });
    
  } catch (error) {
    console.error("❌ [ERROR] Error rejecting station:", error);
    return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
  }
};

// View station location on map
export const viewStationLocation = async (ctx: MyContext) => {
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
    
  } catch (error) {
    console.error("❌ [ERROR] Error sending location:", error);
    return ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true });
  }
};