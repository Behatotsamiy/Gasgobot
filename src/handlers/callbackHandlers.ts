import { MyContext } from "../types.js";
import { cancelBroadcast } from "../commands/broadcast/cancel.js";
import { confirmBroadcast } from "../commands/broadcast/confirm.js";
import {
  backToMenuKeyboard,
  donateKeyboard,
  moneyKeyboard,
  addStation,
  handleAddStationName,
  handleStationCallbacks, // ✅ New centralized handler
  showFuelSelection,
  location_change,
  locationChangeAccept,
} from "../keyboards/_index.js";
import {
  stationInfo,
  stationChange,
  stationStats,
  stationTime,
  pricelist,
  gasInfo,
} from "../commands/stationAdmin/stationAdminsCommands.js";

import { profile } from "../commands/profile.js";
import { Stats } from "../commands/admin/stats.js";
import { admin, findStation } from "../commands/_index.js";
import { adminUsersHandler } from "../commands/admin/users.js";
import { BacktoAdmin } from "../commands/admin/back.js";
import { AdminBroadcast } from "../commands/admin/broadcast.js";
import { requireAdmin } from "../utils/requireAdmin.js";
import { 
  adminPendingStations, 
  showStationReview, 
  approveStation, 
  rejectStation, 
  viewStationLocation 
} from "../commands/admin/adminPendingStations.ts";

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
  "station_share_location": handleStationCallbacks,

  // 🔒 Admin-only
  admin_panel: requireAdmin(admin),
  admin_stats: requireAdmin(Stats),
  "admin_panel:back": requireAdmin(BacktoAdmin),
  admin_broadcast: requireAdmin(AdminBroadcast),
  admin_pending: requireAdmin(adminPendingStations),
  broadcast_confirm: confirmBroadcast,
  broadcast_cancel: cancelBroadcast,
};

export async function HandleCallbackQuery(ctx: MyContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  try {
    // ✅ Handle station management callbacks FIRST (centralized)
    if (data.startsWith("fuel_select:") || 
        data === "fuel_done" || 
        data === "ownership_confirm" || 
        data === "ownership_deny") {
      return await handleStationCallbacks(ctx);
    }

    // ✅ Handle exact match for other callbacks
    const handler = callbackHandlers[data];
    if (handler) {
      return await handler(ctx);
    }

    // ✅ Handle admin users pagination
    if (/^admin_users(\?page=\d+)?$/.test(data)) {
      return await requireAdmin(adminUsersHandler)(ctx);
    }

    // ✅ Handle pending station review (admin-only)
    if (data.startsWith("pending_review:")) {
      return await requireAdmin(showStationReview)(ctx);
    }

    // ✅ Handle station approval (admin-only)
    if (data.startsWith("approve_station:")) {
      return await requireAdmin(approveStation)(ctx);
    }

    // ✅ Handle station rejection (admin-only)
    if (data.startsWith("reject_station:")) {
      return await requireAdmin(rejectStation)(ctx);
    }

    // ✅ Handle view location on map
    if (data.startsWith("view_location:")) {
      return await viewStationLocation(ctx);
    }
        
    // ✅ Handle fuel search (when NOT in station creation)
    if (/^fuel:.+/.test(data)) {
      return await findStation(ctx);
    }

    // ✅ Log unknown callbacks for debugging
    console.warn(`Unknown callback data: ${data}`);
    return await ctx.answerCallbackQuery({ text: "Unknown action", show_alert: true });
  } catch (error) {
    console.error("Error handling callback query:", error);
    return await ctx.answerCallbackQuery({ 
      text: "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.", 
      show_alert: true 
    });
  }
}