import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { locationRequestKeyboard } from "../keyboards/location.js";
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
  if (!ctx.session.prevMenu) {
    ctx.session.prevMenu = "fuel_menu";
  }
  try {
    const telegramId = ctx.from?.id;
    const data = ctx.callbackQuery?.data?.split(":");
    const fuel = data?.[1];
    const index = parseInt(data?.[2] || "0");
    const sortType = data?.[3] || "distance";
    const showFar = data?.[4] === "showMore";

    if (ctx.callbackQuery?.message?.message_id && ctx.chat?.id) {
      await ctx.api.deleteMessage(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id
      );
    }

    await ctx.answerCallbackQuery();
    if (!fuel) return ctx.reply("❗ Yoqilg'i turini tanlang.");

    const user = await UserModel.findOne({ telegramId });
    if (!user)
      return ctx.reply(
        "❗ Foydalanuvchi topilmadi. /start buyrug'ini yuboring."
      );
    if (!user.phone_number)
      return ctx.reply("📞 Telefon raqamingiz saqlanmagan.", {
        reply_markup: locationRequestKeyboard,
      });
    if (!user.location?.lat || !user.location?.lng)
      return ctx.reply("📍 Joylashuvingiz saqlanmagan.", {
        reply_markup: locationRequestKeyboard,
      });

    const stations = await StationModel.find({
      fuel_types: fuel,
      status: "approved",
    });
    if (!stations.length) {
      return ctx.reply("⛽ Bu turdagi yoqilg'i uchun stansiyalar topilmadi.", {
        reply_markup: new InlineKeyboard().text("⬅️ Ortga", "menu:fuel"),
      });
    }

    const stationsWithDistance = stations.map((s) => {
      const sObj = s.toObject();
      const distance = getDistance(user.location!, sObj.location);
      return {
        ...sObj,
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
      const map: Record<string, number> = { green: 1, orange: 2, red: 3 };
      const aHasLevel = a.busyness?.level in map;
      const bHasLevel = b.busyness?.level in map;

      if (sortType === "busyness") {
        if (aHasLevel && bHasLevel) {
          return map[a.busyness.level] - map[b.busyness.level];
        }
        if (aHasLevel) return -1;
        if (bHasLevel) return 1;
        return a.distance - b.distance;
      }

      return a.distance - b.distance;
    });

    const station = sorted[index];
    if (!station) return ctx.reply("❗ Stansiya topilmadi.");

    if (ctx.session?.lastLocationMsgId && ctx.chat?.id) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.session.lastLocationMsgId);
      } catch {}
    }

    const locMsg = await ctx.replyWithLocation(
      station.location.lat,
      station.location.lng
    );
    ctx.session.lastLocationMsgId = locMsg.message_id;

    const unifiedKeyboard = new InlineKeyboard();

    if (index > 0)
      unifiedKeyboard.text(
        "⬅️",
        `fuel:${fuel}:${index - 1}:${sortType}:${showFar ? "showMore" : ""}`
      );
    else unifiedKeyboard.text("|", "noopTwo");

    unifiedKeyboard
      .text(
        sortType === "distance" ? "📍 Masofa ✅" : "📍 Masofa",
        `fuel:${fuel}:0:distance`
      )
      .text(
        sortType === "busyness" ? "📊 Bandlik ✅" : "📊 Bandlik",
        `fuel:${fuel}:0:busyness`
      );

    if (index < sorted.length - 1)
      unifiedKeyboard.text(
        "➡️",
        `fuel:${fuel}:${index + 1}:${sortType}:${showFar ? "showMore" : ""}`
      );
    else unifiedKeyboard.text("|", "noop");

    unifiedKeyboard.row().text("🔙 Ortga", "backToMenu");

    const busynessEmoji =
      {
        green: "🟢",
        orange: "🟠",
        red: "🔴",
      }[station.busyness?.level] || "mavjud emas";

    const price = station.pricing?.[fuel];
    const priceText = price
      ? `💸 Narx: ${price.toLocaleString()} so'm`
      : "💸 Narx: mavjud emas";

    await ctx.reply(
      `⛽ *${station.name}*\n📍 ${(station.distance / 1000).toFixed(
        1
      )} km\n📊 Bandlik: ${busynessEmoji}\n${priceText}\n🧭 ${index + 1} dan ${
        sorted.length
      }`,
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
