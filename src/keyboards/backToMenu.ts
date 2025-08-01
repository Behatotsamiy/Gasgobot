import { MyContext } from "../types.js";
import { showFuelSelection } from "./_fuelkeyboard.ts";
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.ts";
import { donateKeyboard } from "./help.ts";
import { stationInfo, userStationInfo } from "../commands/stationAdmin/stationAdminsCommands.ts";

export const backToMenuKeyboard = async (ctx: MyContext) => {
  ctx.session.step = undefined;
  await ctx.answerCallbackQuery();
  try{await ctx.deleteMessage()}catch{console.log("Message delete did not work baka")}


  switch (ctx.session.prevMenu) {
    case "station_menu":
      return Station_Admin(ctx);
    case "help_menu":
      return donateKeyboard(ctx)
    case "stations":
      return stationInfo(ctx)
    case "fuel_menu":
    default:
      return showFuelSelection(ctx);
  }
};

