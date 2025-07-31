import { MyContext } from "../types.js";
import { showFuelSelection } from "./_fuelkeyboard.ts";
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.ts";
import { donateKeyboard } from "./help.ts";

export const backToMenuKeyboard = async (ctx: MyContext) => {
  ctx.session.step = undefined;
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();

  switch (ctx.session.prevMenu) {
    case "station_menu":
      return Station_Admin(ctx);
    case "help_menu":
      return donateKeyboard(ctx)
    case "fuel_menu":
    default:
      return showFuelSelection(ctx);
  }
};

