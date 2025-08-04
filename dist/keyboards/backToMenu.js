import { showFuelSelection } from "./_fuelkeyboard.js";
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.js";
import { donateKeyboard } from "./help.js";
import { stationInfo, } from "../commands/stationAdmin/stationAdminsCommands.js";
export const backToMenuKeyboard = async (ctx) => {
    ctx.session.step = undefined;
    await ctx.answerCallbackQuery();
    try {
        await ctx.deleteMessage();
    }
    catch {
        console.log("Message delete did not work baka");
    }
    switch (ctx.session.prevMenu) {
        case "station_menu":
            return Station_Admin(ctx);
        case "help_menu":
            return donateKeyboard(ctx);
        case "stations":
            return stationInfo(ctx);
        case "fuel_menu":
        default:
            return showFuelSelection(ctx);
    }
};
