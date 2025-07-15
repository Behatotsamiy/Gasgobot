import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { MyContext } from "../types.js";
import { InlineKeyboard } from "grammy";

function getDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
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
    const showFar = data?.[3] === "showMore";

    // 🧹 Delete previous message (text or button)
    if (ctx.callbackQuery?.message?.message_id) {
      await ctx.api.deleteMessage(ctx.chat?.id!, ctx.callbackQuery.message.message_id);
    }

    await ctx.answerCallbackQuery();

    if (!fuel) {
      return ctx.reply("❗ Укажите тип топлива.");
    }

    const user = await UserModel.findOne({ telegramId });
    if (!user?.location) {
      return ctx.reply("📍 Сначала отправьте своё местоположение.");
    }

    const stations = await StationModel.find({ fuel_types: fuel });
    if (!stations.length) {
      return ctx.reply("⛽ Заправки с этим топливом не найдены.", {
        reply_markup: new InlineKeyboard().text("⬅️ Назад", "menu:fuel"),
      });
    }

    const stationsWithDistance = stations.map((s) => ({
      ...s.toObject(),
      distance: getDistance(user.location, s.location),
    }));

    const filtered = showFar
      ? stationsWithDistance
      : stationsWithDistance.filter((s) => s.distance <= 10000);

    if (!filtered.length) {
      return ctx.reply("😕 Нет заправок с этим топливом в радиусе 10 км.", {
        reply_markup: new InlineKeyboard()
          .text("🔁 Показать дальние", `fuel:${fuel}:0:showMore`)
          .row()
          .text("⬅️ Назад", "menu:fuel"),
      });
    }

    const sorted = filtered.sort((a, b) => a.distance - b.distance);
    const station = sorted[index];

    if (!station) {
      return ctx.reply("❗ Заправка не найдена.");
    }

    // 🧹 Delete previous location if stored
    const userId = ctx.from?.id;
    if (ctx.session?.lastLocationMsgId) {
      try {
        await ctx.api.deleteMessage(ctx.chat?.id!, ctx.session.lastLocationMsgId);
      } catch {}
    }

    // 📍 Send new location and store its ID
    const locMsg = await ctx.replyWithLocation(station.location.lat, station.location.lng);
    ctx.session.lastLocationMsgId = locMsg.message_id;

    // 📄 Send station details with inline buttons
    const keyboard = new InlineKeyboard();

    if (sorted.length > 1) {
      if (index > 0) {
        keyboard.text("⬅️", `fuel:${fuel}:${index - 1}:${showFar ? "showMore" : ""}`);
      }
      if (index < sorted.length - 1) {
        keyboard.text("➡️", `fuel:${fuel}:${index + 1}:${showFar ? "showMore" : ""}`);
      }
    }

    keyboard.row().text("🔙 Назад", "menu:fuel");

    await ctx.reply(
      `⛽ *${station.name}*\n📍 ${(station.distance / 1000).toFixed(1)} км\n🧭 ${index + 1} из ${sorted.length}`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );

  } catch (err) {
    console.error("❌ Ошибка в findStation:", err);
    await ctx.reply("⚠️ Произошла ошибка при поиске заправки.");
  }
};
