import { MyContext } from "../../types.ts";
import {stationAdmin_Keyboard} from "../../keyboards/stationAdminKeyboard.ts"
import { wantTo_AddStantion } from "../../keyboards/wantToAddStantion.ts";

export async function Station_Admin(ctx:MyContext){
    ctx.session.step = "station_menu";
    return stationAdmin_Keyboard(ctx)
}