import { MyContext } from "../types.js";
import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { InlineKeyboard } from "grammy";

const fuelTypes = ["AI-80", "AI-90", "AI-91", "AI-92", "AI-98", "AI-100", "AI-102", "Dizel", "Metan", "Propan", "Elektrik"];

const getFuelKeyboard = (selected: string[]) => ({
  inline_keyboard: [
    ...fuelTypes.map(f => [{
      text: selected.includes(f) ? `✅ ${f}` : f,
      callback_data: `fuel_select:${f}`
    }]),
    [{ text: "✅ Tayyor", callback_data: "fuel_done" }],
    [{ text: "🔙 Orqaga", callback_data: "backToMenu" }]
  ]
});

const getOwnershipKeyboard = () => new InlineKeyboard()
  .text("✅ Ha, men egasiman", "ownership_confirm")
  .text("❌ Yo'q, men egasi emasman", "ownership_deny")
  .text("🔙 Orqaga", "backToMenu");

const getLocationInputKeyboard = () => new InlineKeyboard()
  .text("📍 Joylashuvni yuborish", "station_share_location")
  .row()
  .text("🔙 Orqaga", "backToMenu");

export const addStation = async (ctx: MyContext) => {
  await ctx.deleteMessage().catch(() => {});
  ctx.session.step = "name";
  
  if (!ctx.session.prevMenu) {
    ctx.session.prevMenu = "fuel_menu";
  }
  
  ctx.session.station = { name: "", fuel_types: [] };

  await ctx.reply("📝 Stansiya nomini kiriting:", {
    reply_markup: new InlineKeyboard().text("🔙 Orqaga", "backToMenu")
  });
};

export const handleAddStationName = async (ctx: MyContext) => {
  const step = ctx.session.step;
  const text = ctx.message?.text?.trim();
  
  if (!text) return ctx.reply("❌ Nom bo'sh bo'lishi mumkin emas!");

  if (step === "name") {
    ctx.session.station.name = text;
    ctx.session.step = "fuel";
    await ctx.reply("⛽ Yonilg'i turini tanlang:", {
      reply_markup: getFuelKeyboard([])
    });
  }
  else if (step === "location") {
    const match = text.match(/^([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)$/);
    if (!match) {
      return ctx.reply("❌ Noto'g'ri format! Misol: `41.3030, 69.2829`", { 
        parse_mode: "Markdown" 
      });
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return ctx.reply("❌ Koordinatalar noto'g'ri! Lat: -90 to 90, Lng: -180 to 180");
    }

    ctx.session.station.location = { lat, lng };
    ctx.session.step = "ownership";
    
    await ctx.reply(
      "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
      "⚠️ Faqat rasmiy egalar yoki vakolatli shaxslar stansiya ma'lumotlarini qo'sha oladi.",
      { reply_markup: getOwnershipKeyboard() }
    );
  }
};

export const handleStationLocation = async (ctx: MyContext) => {
  if (ctx.session.step !== "location") return false;
  
  const location = ctx.message?.location;
  if (!location) return false;

  const { latitude, longitude } = location;
  
  ctx.session.station.location = { lat: latitude, lng: longitude };
  ctx.session.step = "ownership";
  
  await ctx.reply(
    `✅ Stansiya joylashuvi saqlandi: ${latitude}, ${longitude}\n\n` +
    "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
    "⚠️ Faqat rasmiy egalar yoki vakolatli shaxslar stansiya ma'lumotlarini qo'sha oladi.",
    { reply_markup: getOwnershipKeyboard() }
  );
  
  return true;
};

export const handleStationCallbacks = async (ctx: MyContext) => {
  const data = ctx.callbackQuery?.data;
  if (!data) return ctx.answerCallbackQuery({ text: "Ma'lumot topilmadi", show_alert: true });

  if (data.startsWith("fuel_select:")) {
    if (ctx.session.step !== "fuel") return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    
    const fuelType = data.split(":")[1];
    const currentFuels = ctx.session.station.fuel_types || [];

    if (currentFuels.includes(fuelType)) {
      ctx.session.station.fuel_types = currentFuels.filter(f => f !== fuelType);
    } else {
      ctx.session.station.fuel_types = [...currentFuels, fuelType];
    }

    await ctx.editMessageReplyMarkup({
      reply_markup: getFuelKeyboard(ctx.session.station.fuel_types)
    });
    
    return ctx.answerCallbackQuery({
      text: currentFuels.includes(fuelType) 
        ? `❌ ${fuelType} olib tashlandi` 
        : `✅ ${fuelType} tanlandi`
    });
  }

  if (data === "fuel_done") {
    if (ctx.session.step !== "fuel") return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    
    if (!ctx.session.station.fuel_types || ctx.session.station.fuel_types.length === 0) {
      return ctx.answerCallbackQuery({ 
        text: "🚫 Hech bo'lmagan bitta yonilg'i turi tanlang!", 
        show_alert: true 
      });
    }

    ctx.session.step = "location";
    await ctx.editMessageText("✅ Yonilg'i turlari saqlandi.");
    await ctx.reply(
      "📍 Stansiya joylashuvini yuboring:\n\n" +
      "📝 **Koordinatalarni yozing**: `41.3030, 69.2829`\n" +
      "📍 **Yoki pastdagi tugmani bosing**", 
      { 
        parse_mode: "Markdown",
        reply_markup: getLocationInputKeyboard()
      }
    );
    return ctx.answerCallbackQuery();
  }

  if (data === "station_share_location") {
    if (!ctx.session || ctx.session.step !== "location") {
      return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    }
    
    await ctx.editMessageText("📍 Stansiya joylashuvini yuboring:");
    return ctx.answerCallbackQuery();
  }

  if (data === "ownership_confirm") {
    if (ctx.session.step !== "ownership") return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    
    const { name, fuel_types, location } = ctx.session.station;
    const userId = ctx.from?.id;
    const userFirstName = ctx.from?.first_name || "Unknown";
    const userUsername = ctx.from?.username || "no_username";

    if (!userId || !name || !fuel_types.length || !location || isNaN(location.lat) || isNaN(location.lng)) {
      console.error("Invalid data:", { userId, name, fuel_types, location });
      return ctx.editMessageText("❌ Noto'g'ri ma'lumotlar!", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }

    try {
      const user = await UserModel.findOne({ telegramId: userId });
      if (!user) {
        console.error("User not found:", userId);
        return ctx.editMessageText("❌ Foydalanuvchi topilmadi!", {
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
        });
      }

      // Check for existing station with exact coordinates
      const existingStation = await StationModel.findOne({
        "location.lat": location.lat,
        "location.lng": location.lng
      });

      if (existingStation) {
        return ctx.editMessageText(
          `❌ Ushbu joylashuvda (${location.lat}, ${location.lng}) allaqachon stansiya mavjud!\n\n` +
          `🏷️ **Mavjud stansiya:** ${existingStation.name}\n` +
          `🆔 **ID:** ${existingStation._id}\n` +
          `📍 Iltimos, boshqa joylashuvni tanlang.`,
          {
            reply_markup: new InlineKeyboard()
              .text("🔙 Joylashuvni qayta kiritish", "station_share_location")
              .row()
              .text("🔙 Bosh menyuga", "backToMenu"),
            parse_mode: "Markdown"
          }
        );
      }

      const newStation = await StationModel.create({
        name,
        fuel_types,
        location,
        owner: user._id,
        status: "approved",
        isOwnerSubmission: true
      });

      console.log("Station created (approved):", { id: newStation._id, name, location });

      const createdAt = newStation.createdAt.toLocaleString('uz-UZ', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      await ctx.editMessageText(
        `✅ Stansiya muvaffaqiyatli qo'shildi:\n\n` +
        `🏷️ <b>Nomi:</b> ${name}\n` +
        `⛽ <b>Yonilg'i turlari:</b> ${fuel_types.join(", ")}\n` +
        `📍 <b>Koordinatalar:</b> ${location.lat}, ${location.lng}\n` +
        `👤 <b>Qo'shgan:</b> ${userFirstName} (@${userUsername})\n` +
        `📅 <b>Qo'shilgan vaqti:</b> ${createdAt}\n` +
        `🆔 <b>Stansiya ID:</b> ${newStation._id}`,
        {
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu"),
          parse_mode: "HTML"
        }
      );            
      
      ctx.session.station = { name: "", fuel_types: [] };
      ctx.session.step = undefined;
      
    } catch (error) {
      console.error("Database error in ownership_confirm:", error);
      await ctx.editMessageText("❌ Saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }
    return ctx.answerCallbackQuery();
  }

  if (data === "ownership_deny") {
    if (ctx.session.step !== "ownership") return ctx.answerCallbackQuery({ text: "Noto'g'ri holat", show_alert: true });
    
    const { name, fuel_types, location } = ctx.session.station;
    const userId = ctx.from?.id;
    const userFirstName = ctx.from?.first_name || "Unknown";
    const userUsername = ctx.from?.username || "no_username";

    if (!userId || !name || !fuel_types.length || !location || isNaN(location.lat) || isNaN(location.lng)) {
      console.error("Invalid data in ownership_deny:", { userId, name, fuel_types, location });
      return ctx.editMessageText("❌ Noto'g'ri ma'lumotlar!", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }

    try {
      const user = await UserModel.findOne({ telegramId: userId });
      if (!user) {
        console.error("User not found in ownership_deny:", userId);
        return ctx.editMessageText("❌ Foydalanuvchi topilmadi!", {
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
        });
      }

      // Check for existing station with exact coordinates
      const existingStation = await StationModel.findOne({
        "location.lat": location.lat,
        "location.lng": location.lng
      });
      ctx.session.prevMenu = "fuel_menu"
      if (existingStation) {
        return ctx.editMessageText(
          `❌ Ushbu joylashuvda (${location.lat}, ${location.lng}) allaqachon stansiya mavjud!\n\n` +
          `🏷️ <b>Mavjud stansiya:</b> ${existingStation.name}\n` +
          `🆔 <b>ID:</b> ${existingStation._id}\n\n` +
          `📍 Iltimos, boshqa joylashuvni tanlang.`,
          {
            reply_markup: new InlineKeyboard()
              .text("🔙 Joylashuvni qayta kiritish", "station_share_location")
              .row()
              .text("🔙 Bosh menyuga", "backToMenu"),
            parse_mode: "HTML"
          }
        );        
      }

      const pendingStation = await StationModel.create({
        name,
        fuel_types,
        location,
        submittedBy: user._id,
        status: "pending",
        isOwnerSubmission: false
      });

      console.log("Pending station created:", { id: pendingStation._id, name, location });

      const submittedAt = pendingStation.createdAt.toLocaleString("uz-UZ", {
        timeZone: "Asia/Tashkent",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      await ctx.editMessageText(
        `✅ Rahmat! Ma'lumotlaringiz ko'rib chiqilish uchun yuborildi.\n\n` +
        `🏷️ **Stansiya nomi:** ${name}\n` +
        `⛽ **Yonilg'i turlari:** ${fuel_types.join(", ")}\n` +
        `📍 **Koordinatalar:** ${location.lat}, ${location.lng}\n` +
        `👤 **Yuborgan:** ${userFirstName} (@${userUsername})\n` +
        `📅 **Yuborilgan vaqti:** ${submittedAt}\n` +
        `🆔 **Tasdiq ID:** ${pendingStation._id}\n\n` +
        `⏳ **Status:** Ko'rib chiqilmoqda\n\n` +
        `📝 Administratorlar ma'lumotlarni tekshirib, tasdiqlangan stansiyalarni tizimga qo'shadi. Rahmat!`,
        { 
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu"),
          parse_mode: "HTML"
        }
      );

      ctx.session.station = { name: "", fuel_types: [] };
      ctx.session.step = undefined;
      
    } catch (error) {
      console.error("Database error in ownership_deny:", error);
      await ctx.editMessageText("❌ Ma'lumotlarni yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }
    return ctx.answerCallbackQuery();
  }
};