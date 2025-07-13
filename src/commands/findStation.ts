import { StationModel } from "../Models/Station.js";
import { UserModel } from "../Models/User.js";
import { MyContext } from "../types.js";



export const findStation = async (ctx: MyContext) => {


    function getDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;

  const hav = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return R * c;
}
  try {
    const telegramId = ctx.from?.id;
    const fuel = ctx.callbackQuery?.data?.split(":")[1];
    if(!fuel){
        console.log("❗ Топливо не указано.");
    }

    // 1. Получаем пользователя
    const user = await UserModel.findOne({ telegramId });
    if (!user || !user.location) {
      await ctx.answerCallbackQuery({
        text: "❗ Пожалуйста, сначала отправьте своё местоположение.",
        show_alert: true,
      });
      return;
    }

    // 2. Получаем все заправки с этим топливом
    const stations = await StationModel.find({ fuel_types: { $in: [fuel] } });
    if (!stations.length) {
      await ctx.reply("❌ Нет заправок с таким типом топлива поблизости.");
      return;
    }

    // 3. Находим ближайшую
    let nearest = stations[0];
    let minDistance = getDistance(user.location, nearest.location);

    for (const station of stations) {
      const distance = getDistance(user.location, station.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }

    // 4. Отправляем результат
    await ctx.reply(`✅ Ближайшая заправка с ${fuel}: *${nearest.name}*`, {
      parse_mode: "Markdown",
    });
    await ctx.replyWithLocation(nearest.location.lat, nearest.location.lng);
  } catch (err) {
    console.error("Ошибка при поиске заправки:", err);
    await ctx.reply("⚠️ Произошла ошибка. Попробуйте позже.");
  }
}