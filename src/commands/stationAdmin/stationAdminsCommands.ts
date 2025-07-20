import { MyContext } from "../../types.ts";
import { UserModel } from "../../Models/User.ts";
import { StationModel } from "../../Models/Station.ts";
import { addStation } from "../../keyboards/addStation.ts";
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.ts";

export async function stationInfo(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  
  // Set prevMenu to station_menu since this is part of station admin flow
  ctx.session.prevMenu = "station_menu";
  
  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });

  if (!user) return ctx.reply("User not found");
  
  const stations = await StationModel.find({ owner: user._id });

  if (stations.length < 1) {
      await ctx.reply("Sizning registratsiyadan o'tgan shaxobchangiz yo'q");
      return wantTo_AddStantion(ctx);
  } else {
      if (stations.length > 1) {
          return ctx.reply("Sizning shahobchalaringiz : " + stations);
      } else {
          return ctx.reply("Sizning shahobchangiz : " + stations);
      }
  }
}
export async function stationChange(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply("✏️ Shaxobchani o'zgartirish bo'limi.");
}

export async function pricelist(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply("⛽ Narx navo: [A-80, AI-92, dizel...]");
}

export async function gasInfo(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply("🛢️ Yoqilg'i holati: [qolgan litrlar, holat]");
}

export async function stationTime(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply("🕒 Ish vaqti: 08:00 - 20:00");
}

export async function stationStats(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply("📊 Statistika: [kunlik kirishlar, so‘rovlar...]");
}
