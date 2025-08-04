import { MyContext } from "../../types.js";
import { stationAdmin_Keyboard } from "../../keyboards/stationAdminKeyboard.js";
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.js";

export async function Station_Admin(ctx: MyContext) {
  ctx.session.step = "station_menu";
  return stationAdmin_Keyboard(ctx);
}
