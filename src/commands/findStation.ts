import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { locationKeyboard } from "./location.ts";
import { MyContext } from "../types.js";
import { InlineKeyboard } from "grammy";

function getDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
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
    const sortType = data?.[3] || "distance";
    const showFar = data?.[4] === "showMore";

    if (ctx.callbackQuery?.message?.message_id) {
      await ctx.api.deleteMessage(
        ctx.chat?.id!,
        ctx.callbackQuery.message.message_id
      );
    }

    await ctx.answerCallbackQuery();

    if (!fuel) return ctx.reply("❗ Yoqilg'i turini tanlang.");

    const user = await UserModel.findOne({ telegramId });
    if (!user) return ctx.reply("❗ Foydalanuvchi topilmadi. /start buyrug'ini yuboring.");
    if (!user.phone_number) return ctx.reply("📞 Telefon raqamingiz saqlanmagan.", { reply_markup: locationKeyboard });
    if (!user.location?.lat || !user.location?.lng) return ctx.reply("📍 Joylashuvingiz saqlanmagan.", { reply_markup: locationKeyboard });

    const stations = await StationModel.find({ fuel_types: fuel, status: { $nin: ["pending", "rejected"] } });

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
      return ctx.reply("😕 10 km radiusda mos stansiyalar topilmadi.", {
        reply_markup: new InlineKeyboard()
          .text("🔁 Uzoqroqni ko‘rish", `fuel:${fuel}:0:${sortType}:showMore`)
          .row()
          .text("➕ Stansiya qo'shish", "addStationKB")
          .row()
          .text("⬅️ Ortga", "backToMenu"),
      });
    }

    const sorted = filtered.sort((a, b) => {
      if (sortType === "busyness") {
        const map: Record<string, number> = { green: 1, orange: 2, red: 3 };
        const getLevel = (s: any) => map[s.busyness?.level] || 4;
        return getLevel(a) - getLevel(b);
      } else {
        return a.distance - b.distance;
      }
    });

    const station = sorted[index];
    if (!station) return ctx.reply("❗ Stansiya topilmadi.");

    if (ctx.session?.lastLocationMsgId) {
      try {
        await ctx.api.deleteMessage(ctx.chat?.id!, ctx.session.lastLocationMsgId);
      } catch {}
    }

    const locMsg = await ctx.replyWithLocation(station.location.lat, station.location.lng);
    ctx.session.lastLocationMsgId = locMsg.message_id;

    const unifiedKeyboard = new InlineKeyboard();

    unifiedKeyboard
      .text(index > 0 ? "⬅️" : " ", `fuel:${fuel}:${index - 1}:${sortType}:${showFar ? "showMore" : ""}`)
      .text(sortType === "distance" ? "📍 Masofa" : "📍 Masofa", `fuel:${fuel}:0:distance`)
      .text(sortType === "busyness" ? "📊 Bandlik" : "📊 Bandlik", `fuel:${fuel}:0:busyness`)
      .text(index < sorted.length - 1 ? "➡️" : " ", `fuel:${fuel}:${index + 1}:${sortType}:${showFar ? "showMore" : ""}`)
      .row()
      .text("🔙 Ortga", "menu:fuel");

    const busynessEmoji = {
      green: "🟢",
      orange: "🟠",
      red: "🔴",
    }[station.busyness?.level] || "❔";

    await ctx.reply(
      `⛽ *${station.name}*\n📍 ${(station.distance / 1000).toFixed(1)} km\n📊 Bandlik: ${busynessEmoji}\n🧭 ${index + 1} dan ${sorted.length}`,
      {
        parse_mode: "Markdown",
        reply_markup: unifiedKeyboard,
      }
    );
  } catch (err) {
    console.error("❌ findStation xatosi:", err);
    await ctx.reply("⚠️ Stansiya qidirishda xatolik yuz berdi.");
  }
};
