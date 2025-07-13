import { MyContext } from "../types.js";
import { StationModel } from "../Models/Station.js";
import { InlineKeyboard, Keyboard } from "grammy";


const fuelTypes = ["AI-80", "AI-90", "AI-91", "AI-92", "AI-98", "AI-100", "AI-102", "Metan", "Propan", "Elektrik"];
const getFuelKeyboard = (selected: string[]) => ({
  inline_keyboard: [
    ...fuelTypes.map(f => [{
      text: selected.includes(f) ? `✅ ${f}` : f,
      callback_data: `fuel:${f}`
    }]),
    [{ text: "✅ Tayyor", callback_data: "fuel_done" }]

  ]
});



export const addStation = async (ctx: MyContext) => {
  ctx.session.step = "name";
  ctx.session.station = { name: "", fuel_types: [] };
  await ctx.reply("📝 Stansiya nomini kiriting:" , {
   reply_markup: new InlineKeyboard().text("Orqaga " , "backToMenu")
  });

}

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
    if (!match) return ctx.reply(" Format: `41.3030, 69.2829`", { parse_mode: "Markdown" });

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    const { name, fuel_types } = ctx.session.station;

    // Сохраняем в MongoDB
    await StationModel.create({
      name,
      fuel_types,
      location: { lat, lng }
    });

    await ctx.reply(`✅ Saqlandi:\n🏷️ ${name}\n⛽ ${fuel_types.join(", ")}\n📍 ${lat}, ${lng}`,
      { reply_markup: new InlineKeyboard().text("Orqaga", "backToMenu") }
    );
    ctx.session = { station: { name: "", fuel_types: [] }, step: undefined };
    
  }
} 

export const handleFuelSelection = async (ctx: MyContext) => {
  if (ctx.session.step !== "fuel") return;

  const data = ctx.callbackQuery?.data;

  if (data?.startsWith("fuel:")) {
    const type = data.split(":")[1];
    const fuels = ctx.session.station.fuel_types;

    if (fuels.includes(type)) {
      ctx.session.station.fuel_types = fuels.filter(f => f !== type);
    } else {
      fuels.push(type);
    }

    await ctx.editMessageReplyMarkup({
      reply_markup: getFuelKeyboard(fuels)
    });
    return ctx.answerCallbackQuery();
  }

  if (data === "fuel_done") {
    if (ctx.session.station.fuel_types.length === 0)
      return ctx.answerCallbackQuery({ text: "🚫 Hech narsa tanlanmagan!" });

    ctx.session.step = "location";
    await ctx.editMessageText("✅ Yonilg'i saqlandi.");
    await ctx.reply("📍 Koordinatani yuboring: `41.3030, 69.2829`", { parse_mode: "Markdown" });
    return ctx.answerCallbackQuery();
  }
}