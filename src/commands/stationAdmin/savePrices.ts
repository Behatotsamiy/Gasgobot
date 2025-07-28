import { MyContext } from "../../types.js";
import { StationModel } from "../../Models/Station.ts";
import { pricelist } from "./stationAdminsCommands.js";
import { UserModel } from "../../Models/User.ts";

export const confirmPriceSave = async (ctx: MyContext) => {
  const userId = ctx.from?.id;
  const user = await UserModel.findOne({ telegramId: userId });
  const selectedIds = ctx.session.selectedStationIds || [];
  const prices = JSON.parse(ctx.session.broadcastPreview || "{}");

  if (!user || selectedIds.length === 0 || Object.keys(prices).length === 0) {
    return ctx.answerCallbackQuery({ text: "❌ Xatolik: narxlar saqlanmadi", show_alert: true });
  }

  await StationModel.updateMany(
    { _id: { $in: selectedIds }, owner: user._id },
    { $set: { pricing: prices } }
  );

  ctx.session.step = undefined;
  ctx.session.broadcastPreview = undefined;
  ctx.session.selectedStationIds = [];

  await ctx.editMessageText("✅ Narxlar muvaffaqiyatli saqlandi.");
  return pricelist(ctx);
};

export const cancelPriceSave = async (ctx: MyContext) => {
  ctx.session.step = undefined;
  ctx.session.broadcastPreview = undefined;
  ctx.session.selectedStationIds = [];

  await ctx.editMessageText("❌ Narx kiritish bekor qilindi.");
  return pricelist(ctx);
};
