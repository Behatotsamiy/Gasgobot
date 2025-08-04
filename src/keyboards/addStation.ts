import { MyContext } from "../types.js";
import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { InlineKeyboard } from "grammy";
import { ADMINS } from "../utils/requireAdmin.js";

const fuelTypes = [
  "AI-80",
  "AI-91",
  "AI-92",
  "AI-95",
  "AI-98",
  "Dizel",
  "Metan",
  "Propan",
  "Elektrik",
];

const getFuelKeyboard = (selected: string[]) => ({
  inline_keyboard: [
    ...fuelTypes.map((f) => [
      {
        text: selected.includes(f) ? `✅ ${f}` : f,
        callback_data: `fuel_select:${f}`,
      },
    ]),
    [{ text: "✅ Tayyor", callback_data: "fuel_done" }],
    [{ text: "🔙 Orqaga", callback_data: "backToMenu" }],
  ],
});

const getOwnershipKeyboard = () =>
  new InlineKeyboard()
    .text("✅ Ha, men egasiman", "ownership_confirm")
    .text("❌ Yo'q, ega emasman", "ownership_deny")
    .text("🔙 Orqaga", "backToMenu");

const getLocationInputKeyboard = () =>
  new InlineKeyboard()
    .text("📍 Joylashuvni yuborish", "station_share_location")
    .row()
    .text("🔙 Orqaga", "backToMenu");

export const addStation = async (ctx: MyContext) => {
  try {
    await ctx.deleteMessage();
  } catch {
    console.log("Message delete did not work baka");
  }
  ctx.session.step = "name";

  if (!ctx.session.prevMenu) {
    ctx.session.prevMenu = "fuel_menu";
  }

  ctx.session.station = {
    name: "",
    fuel_types: [],
    location: { lat: 0, lng: 0 },
  };

  await ctx.reply("📝 Stansiya nomini kiriting:", {
    reply_markup: new InlineKeyboard().text("🔙 Orqaga", "backToMenu"),
  });
};

export const handleAddStationName = async (ctx: MyContext) => {
  const step = ctx.session.step;
  const text = ctx.message?.text?.trim();

  if (!text) return ctx.reply("❌ Nom bo'sh bo'lishi mumkin emas!");

  if (step === "name") {
    if (!ctx.session.station) return ctx.reply("❗ Stansiya topilmadi.");

    ctx.session.station.name = text;
    ctx.session.step = "fuel";
    await ctx.reply("⛽ Yonilg'i turini tanlang:", {
      reply_markup: getFuelKeyboard([]),
    });
  } else if (step === "location") {
    const match = text.match(/^([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)$/);
    if (!match) {
      return ctx.reply(
        "❌ Noto'g'ri format! Misol: <code>41.3030, 69.2829</code>",
        {
          parse_mode: "HTML",
        }
      );
    }

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return ctx.reply(
        "❌ Koordinatalar noto'g'ri! Lat: -90 to 90, Lng: -180 to 180"
      );
    }
    if (!ctx.session.station)
      return ctx.reply("❗ Stansiya ma'lumotlari topilmadi.");
    ctx.session.station.location = { lat, lng };

    ctx.session.step = "ownership";

    await ctx.reply(
      "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
        "Iltimos agar siz shaxobcha ishchisi/egasi/rahbari bo'lmasangiz, shaxobcha ishchilariga bot haqida aytsangiz mamnun bolar edik!",
      { reply_markup: getOwnershipKeyboard() }
    );
  }
};

export const handleStationLocation = async (ctx: MyContext) => {
  if (ctx.session.step !== "location") return false;

  const location = ctx.message?.location;
  if (!location) return false;

  const { latitude, longitude } = location;

  if (!ctx.session.station)
    return ctx.reply("❗ Stansiya ma'lumotlari topilmadi.");
  ctx.session.station.location = {
    lat: location.latitude,
    lng: location.longitude,
  };

  ctx.session.step = "ownership";

  await ctx.reply(
    `✅ Stansiya joylashuvi saqlandi: ${latitude}, ${longitude}\n\n` +
      "🏢 Siz bu stansiyaning egasi yoki rahbari sifatida qo'shyapsizmi?\n\n" +
      "Iltimos agar siz shaxobcha ishchisi/egasi/rahbari bo'lmasangiz, shaxobcha ishchilariga bot haqida aytsangiz mamnun bolar edik!",
    { reply_markup: getOwnershipKeyboard() }
  );

  return true;
};

export const handleStationCallbacks = async (ctx: MyContext) => {
  const data = ctx.callbackQuery?.data;
  if (!data) {
    console.log("⚠️ No callback data received");
    return ctx.answerCallbackQuery({
      text: "Ma'lumot topilmadi",
      show_alert: true,
    });
  }

  console.log("📥 Callback data received:", data);

  if (data.startsWith("fuel_select:")) {
    console.log("⛽ fuel_select triggered");
    console.log("🧠 Session.step:", ctx.session.step);
    console.log("🧠 Session.station:", ctx.session.station);

    if (
      !["fuel", "station_gas_change"].includes(ctx.session.step ?? "") ||
      !ctx.session.station
    ) {
      console.log("🚫 Incorrect session.step or station missing");
      return ctx.answerCallbackQuery({
        text: "Noto'g'ri holat",
        show_alert: true,
      });
    }

    const fuelType = data.split(":")[1];
    const currentFuels = ctx.session.station.fuel_types || [];

    console.log("🛠️ Selected fuelType:", fuelType);
    console.log("📦 Current fuels before change:", currentFuels);

    if (currentFuels.includes(fuelType)) {
      ctx.session.station.fuel_types = currentFuels.filter(
        (f) => f !== fuelType
      );
      console.log("➖ Fuel removed:", fuelType);
    } else {
      ctx.session.station.fuel_types = [...currentFuels, fuelType];
      console.log("➕ Fuel added:", fuelType);
    }

    console.log(
      "📦 Current fuels after change:",
      ctx.session.station.fuel_types
    );

    await ctx.editMessageReplyMarkup({
      reply_markup: getFuelKeyboard(ctx.session.station.fuel_types),
    });

    return ctx.answerCallbackQuery({
      text: currentFuels.includes(fuelType)
        ? `❌ ${fuelType} olib tashlandi`
        : `✅ ${fuelType} tanlandi`,
    });
  }

  if (data === "fuel_done") {
    if (
      !["fuel", "station_gas_change"].includes(ctx.session.step ?? "") ||
      !ctx.session.station
    ) {
      return ctx.answerCallbackQuery({
        text: "Noto'g'ri holat",
        show_alert: true,
      });
    }

    if (
      !ctx.session.station.fuel_types ||
      ctx.session.station.fuel_types.length === 0
    ) {
      return ctx.answerCallbackQuery({
        text: "🚫 Hech bo'lmagan bitta yonilg'i turi tanlang!",
        show_alert: true,
      });
    }

    ctx.session.step = "location";
    await ctx.editMessageText("✅ Yonilg'i turlari saqlandi.");
    await ctx.reply(
      "📍 Stansiya joylashuvini yuboring:\n\n" +
        "📝 <b>Koordinatalarni yozing</b>: <code>41.3030, 69.2829</code>\n" +
        "📍 <b>Yoki lokatsiyani jo'nating</b>",
      {
        parse_mode: "HTML",
      }
    );
    return ctx.answerCallbackQuery();
  }

  if (data === "station_share_location") {
    ctx.session.step = "location";
    await ctx.editMessageText(
      "📍 Stansiya joylashuvini yuboring:\n\n" +
        "📝 <b>Koordinatalarni yozing</b>: <code>41.3030, 69.2829</code>\n" +
        "📍 <b>Yoki lokatsiyani yuboring</b>",
      { parse_mode: "HTML" }
    );
    return ctx.answerCallbackQuery();
  }

  if (data === "ownership_confirm") {
    if (ctx.session.step !== "ownership")
      return ctx.answerCallbackQuery({
        text: "Noto'g'ri holat",
        show_alert: true,
      });

    const { name, fuel_types, location } = ctx.session.station!;

    const userId = ctx.from?.id;
    const userFirstName = ctx.from?.first_name || "Unknown";
    const userUsername = ctx.from?.username || "no_username";

    if (
      !userId ||
      !name ||
      !fuel_types.length ||
      !location ||
      isNaN(location.lat) ||
      isNaN(location.lng)
    ) {
      console.error("Invalid data:", { userId, name, fuel_types, location });
      return ctx.editMessageText("❌ Noto'g'ri ma'lumotlar!", {
        reply_markup: new InlineKeyboard().text(
          "🔙 Bosh menyuga",
          "backToMenu"
        ),
      });
    }

    try {
      const user = await UserModel.findOne({ telegramId: userId });
      if (!user) {
        console.error("User not found:", userId);
        return ctx.editMessageText("❌ Foydalanuvchi topilmadi!", {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
        });
      }

      // Check for existing station with exact coordinates
      const existingStation = await StationModel.findOne({
        "location.lat": location.lat,
        "location.lng": location.lng,
      });

      if (existingStation) {
        ctx.session.step = "location"; // ✅ Reset step so user can re-enter coordinates
        return ctx.editMessageText(
          `❌ Ushbu joylashuvda (${location.lat}, ${location.lng}) allaqachon stansiya mavjud!\n\n` +
            `🏷️ <b>Mavjud stansiya:</b> ${existingStation.name}\n` +
            `🆔 <b>ID:</b> ${existingStation._id}\n` +
            `📍 Iltimos, boshqa joylashuvni tanlang.`,
          {
            reply_markup: new InlineKeyboard()
              .text("🔙 Joylashuvni qayta kiritish", "station_share_location")
              .row()
              .text("🔙 Bosh menyuga", "backToMenu"),
            parse_mode: "HTML",
          }
        );
      }

      // For owner submissions, create as pending first for review
      const newStation = await StationModel.create({
        name,
        fuel_types,
        location,
        owner: user._id,
        status: "pending", // Changed to pending for review
        isOwnerSubmission: true,
      });

      console.log("Station created (pending review):", {
        id: newStation._id,
        name,
        location,
      });

      const createdAt = newStation.createdAt.toLocaleString("uz-UZ", {
        timeZone: "Asia/Tashkent",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      await ctx.editMessageText(
        `✅ Stansiya ma'lumotlari yuborildi va ko'rib chiqilish uchun navbatga qo'shildi:\n\n` +
          `🏷️ <b>Nomi:</b> ${name}\n` +
          `⛽ <b>Yonilg'i turlari:</b> ${fuel_types.join(", ")}\n` +
          `📍 <b>Koordinatalar:</b> ${location.lat}, ${location.lng}\n` +
          `👤 <b>Qo'shgan:</b> ${userFirstName} (@${userUsername})\n` +
          `📅 <b>Yuborilgan vaqti:</b> ${createdAt}\n` +
          `🆔 <b>Tasdiq ID:</b> ${newStation._id}\n\n` +
          `⏳ <b>Status:</b> Ko'rib chiqilmoqda\n\n` +
          `📝 Egasi sifatida yuborilgan ma'lumotlar ham administratorlar tomonidan tekshiriladi va tasdiqlangandan so'ng tizimga qo'shiladi. Rahmat!`,
        {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
          parse_mode: "HTML",
        }
      );
      for (const adminId of ADMINS) {
        try {
          await ctx.api.sendMessage(
            adminId,
            "🆕 Yangi stansiya qo‘shilishga yuborildi, iltimos menyuga o‘tib tekshiring.",
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "✅ Tekshirish", callback_data: "admin_pending" }],
                ],
              },
            }
          );
        } catch (err) {
          console.error("Admin notification failed:", err);
        }
      }

      ctx.session.station = {
        name: "",
        fuel_types: [],
        location: { lat: 0, lng: 0 },
      };

      ctx.session.step = undefined;
    } catch (error) {
      console.error("Database error in ownership_confirm:", error);
      await ctx.editMessageText(
        "❌ Saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
        {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
        }
      );
    }
    return ctx.answerCallbackQuery();
  }

  if (data === "ownership_deny") {
    if (ctx.session.step !== "ownership")
      return ctx.answerCallbackQuery({
        text: "Noto'g'ri holat",
        show_alert: true,
      });

    const { name, fuel_types, location } = ctx.session.station!;

    const userId = ctx.from?.id;
    const userFirstName = ctx.from?.first_name || "Unknown";
    const userUsername = ctx.from?.username || "no_username";

    if (
      !userId ||
      !name ||
      !fuel_types.length ||
      !location ||
      isNaN(location.lat) ||
      isNaN(location.lng)
    ) {
      console.error("Invalid data in ownership_deny:", {
        userId,
        name,
        fuel_types,
        location,
      });
      return ctx.editMessageText("❌ Noto'g'ri ma'lumotlar!", {
        reply_markup: new InlineKeyboard().text(
          "🔙 Bosh menyuga",
          "backToMenu"
        ),
      });
    }

    try {
      const user = await UserModel.findOne({ telegramId: userId });
      if (!user) {
        console.error("User not found in ownership_deny:", userId);
        return ctx.editMessageText("❌ Foydalanuvchi topilmadi!", {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
        });
      }

      // Check for existing station with exact coordinates
      const existingStation = await StationModel.findOne({
        "location.lat": location.lat,
        "location.lng": location.lng,
      });

      ctx.session.prevMenu = "fuel_menu";

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
            parse_mode: "HTML",
          }
        );
      }

      const pendingStation = await StationModel.create({
        name,
        fuel_types,
        location,
        submittedBy: user._id,
        status: "pending",
        isOwnerSubmission: false,
      });

      console.log("Pending station created:", {
        id: pendingStation._id,
        name,
        location,
      });

      const submittedAt = pendingStation.createdAt.toLocaleString("uz-UZ", {
        timeZone: "Asia/Tashkent",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      await ctx.editMessageText(
        `✅ Rahmat! Ma'lumotlaringiz ko'rib chiqilish uchun yuborildi.\n\n` +
          `🏷️ <b>Stansiya nomi:</b> ${name}\n` +
          `⛽ <b>Yonilg'i turlari:</b> ${fuel_types.join(", ")}\n` +
          `📍 <b>Koordinatalar:</b> ${location.lat}, ${location.lng}\n` +
          `👤 <b>Yuborgan:</b> ${userFirstName} (@${userUsername})\n` +
          `📅 <b>Yuborilgan vaqti:</b> ${submittedAt}\n` +
          `🆔 <b>Tasdiq ID:</b> ${pendingStation._id}\n\n` +
          `⏳ <b>Status:</b> Ko'rib chiqilmoqda\n\n` +
          `📝 Administratorlar ma'lumotlarni tekshirib, tasdiqlangan stansiyalarni tizimga qo'shadi. Rahmat!`,
        {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
          parse_mode: "HTML",
        }
      );
      for (const adminId of ADMINS) {
        try {
          await ctx.api.sendMessage(
            adminId,
            "🆕 Yangi stansiya qo‘shilishga yuborildi, iltimos menyuga o‘tib tekshiring.",
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "✅ Tekshirish", callback_data: "admin_pending" }],
                ],
              },
            }
          );
        } catch (err) {
          console.error("Admin notification failed:", err);
        }
      }

      ctx.session.station = {
        name: "",
        fuel_types: [],
        location: { lat: 0, lng: 0 },
      };

      ctx.session.step = undefined;
    } catch (error) {
      console.error("Database error in ownership_deny:", error);
      await ctx.editMessageText(
        "❌ Ma'lumotlarni yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
        {
          reply_markup: new InlineKeyboard().text(
            "🔙 Bosh menyuga",
            "backToMenu"
          ),
        }
      );
    }
    return ctx.answerCallbackQuery();
  }
};
