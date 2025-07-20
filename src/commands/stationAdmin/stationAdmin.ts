import { MyContext } from "../../types.ts";
import {stationAdmin_Keyboard} from "../../keyboards/stationAdminKeyboard.ts"

export async function Station_Admin(ctx:MyContext){
    ctx.session.step = "station_menu";
    return stationAdmin_Keyboard(ctx)
}