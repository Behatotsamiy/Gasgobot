import { MyContext } from "../../types.ts";
import { UserModel } from "../../Models/User.ts";
import { StationModel } from "../../Models/Station.ts";
import { addStation } from "../../keyboards/addStation.ts";
import { InlineKeyboard } from "grammy";
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.ts";
import { StaitonShort, Stationlong, editStation } from "../../keyboards/manageStations.ts";

export async function stationInfo(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  ctx.session.prevMenu = "station_menu";

  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });

  if (!user) return ctx.reply("Foydalanuvchi topilmadi");

  const stations = await StationModel.find({ owner: user._id });

  if (stations.length < 1) {
    await ctx.reply("Sizning registratsiyadan o'tgan shaxobchangiz yo'q");
    return wantTo_AddStantion(ctx);
  }

  for (const station of stations) {
    StaitonShort(station.name , station._id , ctx)
  }
}
export const userStationInfo = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  const station = await StationModel.findById(stationId);
  if (!station) {
    return ctx.reply("❌ Stansiya topilmadi");
  }
  return Stationlong(station , ctx)
};
export const stationChange = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  const station = await StationModel.findById(stationId);
  if (!station) {
    return ctx.reply("❌ Stansiya topilmadi");
  }
  return editStation(ctx , station?._id)
};

export const deleteStation = async (ctx: MyContext) => {
  const stationId = ctx.callbackQuery?.data?.split(":")[1];
  await ctx.answerCallbackQuery();

  const station = await StationModel.findById(stationId);
  if (!station) return ctx.reply("❌ Stansiya topilmadi");

  await station.deleteOne();
  await ctx.editMessageText("✅ Stansiya o'chirildi");
};
