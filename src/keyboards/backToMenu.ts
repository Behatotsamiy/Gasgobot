import { MyContext } from "../types.js";
import { showFuelSelection } from "./_fuelkeyboard.ts";
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.ts";

export const backToMenuKeyboard = async (ctx: MyContext) => {
  ctx.answerCallbackQuery();
  await ctx.deleteMessage();
  
  // Check if coming from station menu
  if (ctx.session.prevMenu === "station_menu") {
    return Station_Admin(ctx);
  } 
  // Check if coming from fuel menu or default to fuel selection
  else if (ctx.session.prevMenu === "fuel_menu" || !ctx.session.prevMenu) {
    return showFuelSelection(ctx);
  }
  // Fallback to fuel selection for any other case
  else {
    return showFuelSelection(ctx);
  }
};