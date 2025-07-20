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
  await ctx.deleteMessage();
  ctx.session.step = "name";
  
  // Keep the existing prevMenu value instead of overwriting it
  if (!ctx.session.prevMenu) {
    ctx.session.prevMenu = "fuel_menu"; // Default fallback
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
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return ctx.reply("❌ Koordinatalar noto'g'ri! Lat: -90 to 90, Lng: -180 to 180");
    }

    // Store coordinates and move to ownership confirmation
    ctx.session.station.location = { lat, lng };
    ctx.session.step = "ownership";
    
    await ctx.reply(
      "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
      "⚠️ Faqat rasmiy egalar yoki vakolatli shaxslar stansiya ma'lumotlarini qo'sha oladi.",
      { reply_markup: getOwnershipKeyboard() }
    );
  }
};

// NEW: Handle station location sharing (separate from user profile location)
export const handleStationLocation = async (ctx: MyContext) => {
  // Only handle location if we're in station creation mode
  if (ctx.session.step !== "location") return false;
  
  const location = ctx.message?.location;
  if (!location) return false;

  const { latitude, longitude } = location;
  
  // Store station coordinates
  ctx.session.station.location = { lat: latitude, lng: longitude };
  ctx.session.step = "ownership";
  
  await ctx.reply(
    `✅ Stansiya joylashuvi saqlandi: ${latitude}, ${longitude}\n\n` +
    "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
    "⚠️ Faqat rasmiy egalar yoki vakolatli shaxslar stansiya ma'lumotlarini qo'sha oladi.",
    { reply_markup: getOwnershipKeyboard() }
  );
  
  return true; // Indicate we handled this location
};

// Centralized callback query handler for station management
export const handleStationCallbacks = async (ctx: MyContext) => {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  // Handle fuel selection/deselection
  if (data.startsWith("fuel_select:")) {
    if (ctx.session.step !== "fuel") return;
    
    const fuelType = data.split(":")[1];
    const currentFuels = ctx.session.station.fuel_types || [];

    // Toggle selection: if selected, remove it; if not selected, add it
    if (currentFuels.includes(fuelType)) {
      ctx.session.station.fuel_types = currentFuels.filter(f => f !== fuelType);
    } else {
      ctx.session.station.fuel_types = [...currentFuels, fuelType];
    }

    // Update the keyboard with new selection state
    await ctx.editMessageReplyMarkup({
      reply_markup: getFuelKeyboard(ctx.session.station.fuel_types)
    });
    
    return ctx.answerCallbackQuery({
      text: currentFuels.includes(fuelType) 
        ? `❌ ${fuelType} olib tashlandi` 
        : `✅ ${fuelType} tanlandi`
    });
  }

  // Handle fuel selection completion
  if (data === "fuel_done") {
    if (ctx.session.step !== "fuel") return;
    
    if (!ctx.session.station.fuel_types || ctx.session.station.fuel_types.length === 0) {
      return ctx.answerCallbackQuery({ 
        text: "🚫 Hech bo'lmagan bitta yonilg'i turi tanlang!" 
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

  // Handle location sharing button
  if (data === "station_share_location") {
    if (ctx.session.step !== "location") return;
    
    await ctx.editMessageText("📍 Stansiya joylashuvini yuboring:");
    await ctx.reply(
      "Pastdagi tugmani bosib, stansiya joylashuvini yuboring.",
      {
        reply_markup: {
          keyboard: [[{ text: "📍 Joylashuvni yuborish", request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
    return ctx.answerCallbackQuery();
  }

  // Handle ownership confirmation
  if (data === "ownership_confirm") {
    if (ctx.session.step !== "ownership") return;
    
    await ctx.answerCallbackQuery();
    
    const { name, fuel_types, location } = ctx.session.station;
    const userId = ctx.from?.id;
    const userFirstName = ctx.from?.first_name || "Unknown";
    const userUsername = ctx.from?.username || "no_username";

    if (!userId) {
      return ctx.editMessageText("❌ User ID topilmadi!", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }

    try {
      // Find user to get their database ID
      const user = await UserModel.findOne({ telegramId: userId });
      if (!user) {
        return ctx.editMessageText("❌ Foydalanuvchi topilmadi!", {
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
        });
      }

      // Save to MongoDB with user association
      const newStation = await StationModel.create({
        name,
        fuel_types,
        location,
        owner: user._id
      });

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
        `🏷️ **Nomi:** ${name}\n` +
        `⛽ **Yonilg'i turlari:** ${fuel_types.join(", ")}\n` +
        `📍 **Koordinatalar:** ${location.lat}, ${location.lng}\n` +
        `👤 **Qo'shgan:** ${userFirstName} (@${userUsername})\n` +
        `📅 **Qo'shilgan vaqti:** ${createdAt}\n` +
        `🆔 **Stansiya ID:** ${newStation._id}`,
        { 
          reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu"),
          parse_mode: "Markdown"
        }
      );
      
      // Reset only station data and step, keep prevMenu
      ctx.session.station = { name: "", fuel_types: [] };
      ctx.session.step = undefined;
      
    } catch (error) {
      console.error("Database error:", error);
      await ctx.editMessageText("❌ Saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.", {
        reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu")
      });
    }
    return;
  }

  // Handle ownership denial
  if (data === "ownership_deny") {
    if (ctx.session.step !== "ownership") return;
    
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "❌ Kechirasiz, faqat stansiya egalari yoki vakolatli shaxslar ma'lumot qo'sha oladi.\n\n" +
      "Agar siz stansiya egasi bo'lsangiz, iltimos qaytadan urinib ko'ring.",
      { reply_markup: new InlineKeyboard().text("🔙 Bosh menyuga", "backToMenu") }
    );
    
    // Reset session
    ctx.session.station = { name: "", fuel_types: [] };
    ctx.session.step = undefined;
    return;
  }
};