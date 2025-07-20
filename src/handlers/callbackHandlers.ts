import { MyContext } from "../types.js";
import { cancelBroadcast } from "../commands/broadcast/cancel.ts";
import { confirmBroadcast } from "../commands/broadcast/confirm.js";
import {
  locationKeyboard,
  backToMenuKeyboard,
  donateKeyboard,
  moneyKeyboard,
  addStation,
  handleAddStationName,
  handleStationCallbacks, // ✅ New centralized handler
  showFuelSelection,
  location_change,
  locationChangeAccept,
} from "../keyboards/_index.ts";
import {
  stationInfo,
  stationChange,
  stationStats,
  stationTime,
  pricelist,
  gasInfo,
} from "../commands/stationAdmin/stationAdminsCommands.ts";

import { profile } from "../commands/profile.ts";
import { Stats } from "../commands/admin/stats.ts";
import { admin, findStation } from "../commands/_index.ts";
import { adminUsersHandler } from "../commands/admin/users.ts";
import { BacktoAdmin } from "../commands/admin/back.ts";
import { AdminBroadcast } from "../commands/admin/broadcast.ts";
import { requireAdmin } from "../utils/requireAdmin.ts";

const callbackHandlers: Record<string, (ctx: MyContext) => Promise<unknown>> = {
  profile,
  backToMenu: backToMenuKeyboard,
  donate: donateKeyboard,
  money: moneyKeyboard,
  "menu:fuel": showFuelSelection,
  location_change: location_change,
  "location:yes": locationChangeAccept,
  
  // Station management
  addStationKB: addStation,
  station_info: stationInfo,
  station_change: stationChange,
  pricelist: pricelist,
  gas_info: gasInfo,
  time: stationTime,
  station_statics: stationStats,

  // 🔒 Admin-only
  admin_panel: requireAdmin(admin),
  admin_stats: requireAdmin(Stats),
  "admin_panel:back": requireAdmin(BacktoAdmin),
  admin_broadcast: requireAdmin(AdminBroadcast),
  broadcast_confirm: confirmBroadcast,
  broadcast_cancel: cancelBroadcast,
};

export async function HandleCallbackQuery(ctx: MyContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  // ✅ Handle station management callbacks FIRST (centralized)
  if (data.startsWith("fuel_select:") || 
      data === "fuel_done" || 
      data === "ownership_confirm" || 
      data === "ownership_deny" ||
      data === "station_share_location") {
    return handleStationCallbacks(ctx);
  }

  // ✅ Handle exact match for other callbacks
  const handler = callbackHandlers[data];
  if (handler) return handler(ctx);

  // ✅ Handle admin users pagination
  if (/^admin_users(\?page=\d+)?$/.test(data)) {
    return requireAdmin(adminUsersHandler)(ctx);
  }
      
  // ✅ Handle fuel search (when NOT in station creation)
  if (/^fuel:.+/.test(data)) {
    return findStation(ctx);
  }

  // ✅ Log unknown callbacks for debugging
  console.warn(`Unknown callback data: ${data}`);
  return ctx.answerCallbackQuery({ text: "Unknown action", show_alert: true });
}