import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { locationKeyboard } from "./location.ts";
import { MyContext } from "../types.js";
import { InlineKeyboard, Keyboard } from "grammy";

function getDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const aHav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(aHav), Math.sqrt(1 - aHav));
  return R * c;
}

export const findStation = async (ctx: MyContext) => {
  try {
    const telegramId = ctx.from?.id;
    const data = ctx.callbackQuery?.data?.split(":");
    const fuel = data?.[1];
    const index = parseInt(data?.[2] || "0");
    const showFar = data?.[3] === "showMore";

    if (ctx.callbackQuery?.message?.message_id) {
      await ctx.api.deleteMessage(
        ctx.chat?.id!,
        ctx.callbackQuery.message.message_id
      );
    }

    await ctx.answerCallbackQuery();

    if (!fuel) {
      return ctx.reply("❗ Yoqilg'i turini tanlang.");
    }

    const user = await UserModel.findOne({ telegramId });

    if (!user) {
      return ctx.reply(
        "❗ Foydalanuvchi topilmadi. Iltimos, /start buyrug‘ini yuboring."
      );
    }

    // 📞 Check for missing phone number
    if (!user.phone_number) {
      return ctx.reply(
        "📞 Telefon raqamingiz saqlanmagan. Iltimos, raqamingizni yuboring.",
        {
          reply_markup: locationKeyboard,
        }
      );
    }

    // 📍 Check for missing location
    if (!user.location?.lat || !user.location?.lng) {
      return ctx.reply(
        "📍 Joylashuvingiz saqlanmagan. Iltimos, lokatsiyangizni yuboring.",
        {
          reply_markup: locationKeyboard,
        }
      );
    }

    const stations = await StationModel.find({ fuel_types: fuel });

    if (!stations.length) {
      return ctx.reply("⛽ Bu turdagi yoqilg'i uchun stansiyalar topilmadi.", {
        reply_markup: new InlineKeyboard().text("⬅️ Ortga", "menu:fuel"),
      });
    }

    const stationsWithDistance = stations.map((s) => {
      const distance = getDistance(user.location, s.location);
      return {
        ...s.toObject(),
        distance: isNaN(distance) ? Infinity : distance,
      };
    });

    const filtered = showFar
      ? stationsWithDistance
      : stationsWithDistance.filter((s) => s.distance <= 10000);

    if (!filtered.length) {
      return ctx.reply(
        "😕 10 km radiusda mos stansiyalar topilmadi.\n\nYangi stansiya qo‘shish orqali boshqalarga yordam bering 👇",
        {
          reply_markup: new InlineKeyboard()
            .text("🔁 Uzoqroqni ko‘rish", `fuel:${fuel}:0:showMore`)
            .row()
            .text("➕ Stansiya qo'shish", "addStationKB")
            .row()
            .text("⬅️ Ortga", "backToMenu"),
        }
      );
    }

    const sorted = filtered.sort((a, b) => a.distance - b.distance);
    const station = sorted[index];

    if (!station) {
      return ctx.reply("❗ Stansiya topilmadi.");
    }

    if (ctx.session?.lastLocationMsgId) {
      try {
        await ctx.api.deleteMessage(
          ctx.chat?.id!,
          ctx.session.lastLocationMsgId
        );
      } catch (e) {}
    }

    const locMsg = await ctx.replyWithLocation(
      station.location.lat,
      station.location.lng
    );
    ctx.session.lastLocationMsgId = locMsg.message_id;

    const keyboard = new InlineKeyboard();

    if (sorted.length > 1) {
      if (index > 0) {
        keyboard.text(
          "⬅️",
          `fuel:${fuel}:${index - 1}:${showFar ? "showMore" : ""}`
        );
      }
      if (index < sorted.length - 1) {
        keyboard.text(
          "➡️",
          `fuel:${fuel}:${index + 1}:${showFar ? "showMore" : ""}`
        );
      }
    }

    keyboard.row().text("🔙 Ortga", "menu:fuel");

    await ctx.reply(
      `⛽ *${station.name}*\n📍 ${(station.distance / 1000).toFixed(
        1
      )} km\n🧭 ${index + 1} dan ${sorted.length}`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("❌ findStation xatosi:", err);
    await ctx.reply("⚠️ Stansiya qidirishda xatolik yuz berdi.");
  }
};
