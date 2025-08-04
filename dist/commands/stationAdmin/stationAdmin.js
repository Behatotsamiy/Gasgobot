import { stationAdmin_Keyboard } from "../../keyboards/stationAdminKeyboard.js";
export async function Station_Admin(ctx) {
    ctx.session.step = "station_menu";
    return stationAdmin_Keyboard(ctx);
}
