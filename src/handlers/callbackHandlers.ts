import { MyContext } from './../types.js';
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
  stationAdmin_Keyboard,
} from "../keyboards/_index.js";
import {
  stationInfo,
  stationChange,
  userStationInfo,
  deleteStation,
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
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.ts";
import { editStation } from "../keyboards/manageStations.ts";

// Import your edit fuel handlers (you'll need to create these)
import { handleEditFuelSelection, handleFuelDone } from "../keyboards/manageStations.ts";

const callbackHandlers: Record<string, (ctx: MyContext) => Promise<unknown>> = {
  profile,
  backToMenu: backToMenuKeyboard,
  donate: donateKeyboard,
  money: moneyKeyboard,
  "menu:fuel": showFuelSelection,
  location_change: location_change,
  "location:yes": locationChangeAccept,
  
  // Station management
  fuel_changed: editStation,
  addStationKB: addStation,
  station_info: stationInfo,
  station_change: stationChange,
  "station_share_location": handleStationCallbacks,

  // Edit fuel handlers
  edit_fuel_complete: handleFuelDone,

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
    if(data === "station_admin"){
      await ctx.deleteMessage()
      ctx.session.step = "station_menu";
      return stationAdmin_Keyboard(ctx)
    }

    // ✅ Handle station EDITING fuel selection (completely separate from creation)
    if (data.startsWith("edit_fuel_select:")) {
      const fuelType = data.split(":")[1];
      return await handleEditFuelSelection(ctx, fuelType);
    }

    // ✅ Handle station management callbacks for CREATION (centralized)
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
    
    if (data.startsWith("user_station_info:")) {
      return await userStationInfo(ctx);
    }
    if (data.startsWith("edit_station:")) {
      return await stationChange(ctx);
    }
    if (data.startsWith("delete_station:")) {
      return await deleteStation(ctx);
    }

    if (data.startsWith("station_name_change:")) {
      return await stationChange(ctx);
    }
    if (data.startsWith("station_gas_change:")) {
      return await stationChange(ctx);
    }
    if (data.startsWith("station_location_change:")) {
      return await stationChange(ctx);
    }

    if (/^admin_users(\?page=\d+)?$/.test(data)) {
      return await requireAdmin(adminUsersHandler)(ctx);
    }

    if (data.startsWith("pending_review:")) {
      return await requireAdmin(showStationReview)(ctx);
    }

    if (data.startsWith("approve_station:")) {
      return await requireAdmin(approveStation)(ctx);
    }

    if (data.startsWith("reject_station:")) {
      return await requireAdmin(rejectStation)(ctx);
    }

    if (data.startsWith("view_location:")) {
      return await viewStationLocation(ctx);
    }

    if (/^fuel:.+/.test(data)) {
      return await findStation(ctx);
    }

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