import { MyContext } from "./../types.js";
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
  pricelist,
  changePrice,
  currentPrices,
  toggleStation,
  confirmStationSelection,
  handleMyPrices,
  handleCompetitorPrices,
  handleStationMainMenu,
  confirmPriceSave,
  cancelPriceSave,
  skipFuelPrice,
  handleFuelPriceInput, // Add this export to your stationAdminsCommands.ts
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
  viewStationLocation,
  setStationToTesting,
} from "../commands/admin/adminPendingStations.ts";
import { Station_Admin } from "../commands/stationAdmin/stationAdmin.ts";
import { editStation } from "../commands/stationAdmin/manageStations.ts";

// Import your edit fuel handlers
import {
  handleEditFuelSelection,
  handleFuelDone,
} from "../commands/stationAdmin/manageStations.ts";
import { Busyness, ChangeBusyness } from "../commands/stationAdmin/busyness.ts";
import { GetUserFeedback } from "../commands/Feedback.ts";

const callbackHandlers: Record<string, (ctx: MyContext) => Promise<unknown>> = {
  profile,
  backToMenu: backToMenuKeyboard,
  donate: donateKeyboard,
  money: moneyKeyboard,
  "menu:fuel": showFuelSelection,
  location_change: location_change,
  "location:yes": locationChangeAccept,

  fuel_changed: editStation,
  confirm_price_save: confirmPriceSave,
  cancel_price_save: cancelPriceSave,
  skip_fuel_price: skipFuelPrice, // Add this
  cancel_price_setting: cancelPriceSave, // Add this for canceling price setting
  addStationKB: addStation,
  station_info: stationInfo,
  station_change: stationChange,
  station_share_location: handleStationCallbacks,
  confirm_station_selection: confirmStationSelection,
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

  // noop
  noop: (ctx: MyContext) =>
    ctx
      .answerCallbackQuery({
        text: "Boshqa shaxobchalar yo'q",
        show_alert: true,
      })
      .catch(() => {}),
  noopTwo: (ctx: MyContext) =>
    ctx
      .answerCallbackQuery({ text: "Oldingi sahifa yo'q", show_alert: true })
      .catch(() => {}),

  feedback: GetUserFeedback,
};

export async function HandleCallbackQuery(ctx: MyContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  try {
    const dynamicHandlers = [
      [/^edit_fuel_select:/, handleEditFuelSelection],
      [/^fuel_select:/, handleStationCallbacks],
      [/^fuel_done$/, handleStationCallbacks],
      [/^ownership_(confirm|deny)$/, handleStationCallbacks],
      [/^station_busyness:/, Busyness],
      [/^busyness_set:/, ChangeBusyness],
      [/^toggle_station:/, toggleStation],
      [/^user_station_info:/, userStationInfo],
      [/^edit_station:/, stationChange],
      [/^delete_station:/, deleteStation],
      [/^testing_station:/, setStationToTesting],
      [/^station_name_change:/, stationChange],
      [/^station_gas_change:/, stationChange],
      [/^station_location_change:/, stationChange],
      [/^my_prices:/, handleMyPrices],
      [/^station_menu:/, handleStationMainMenu],
      [/^confirm_price_save/, confirmPriceSave],
      [/^cancel_price_save/, cancelPriceSave],
      [/^skip_fuel_price$/, skipFuelPrice],
      [/^change_prices:/, changePrice],
      [/^pricelist:/, pricelist],
      [/^view_prices:/, currentPrices],
      [/^competitor_prices:/, handleCompetitorPrices],


      [/^admin_users(\?page=\d+)?$/, requireAdmin(adminUsersHandler)],
      [/^pending_review:/, requireAdmin(showStationReview)],
      [/^approve_station:/, requireAdmin(approveStation)],
      [/^reject_station:/, requireAdmin(rejectStation)],
      [/^view_location:/, viewStationLocation],
      [/^fuel:.+/, findStation],
      [/^backToMenu$/, backToMenuKeyboard],
      [/^add_station$/, addStation],
    ];

    if (data === "station_admin") {
      try {
        await ctx.deleteMessage();
      } catch {
        console.log("Message delete did not work baka");
      }
      ctx.session.step = "station_menu";
      await stationAdmin_Keyboard(ctx);
    } else if (callbackHandlers[data]) {
      await callbackHandlers[data](ctx);
    } else {
      const match = dynamicHandlers.find(([regex]) => regex.test(data));
      if (match) {
        const handler = match[1];
        const arg = data.includes(":") ? data.split(":")[1] : undefined;
        await handler(ctx, arg);
      } else {
        console.warn(`Unknown callback data: ${data}`);
        await ctx.answerCallbackQuery({
          text: "Nomaʼlum amal",
          show_alert: true,
        });
        return;
      }
    }

    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Callback error:", err);
    if ("callback_query" in ctx.update) {
      await ctx.answerCallbackQuery({
        text: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
        show_alert: true,
      });
    }
  }
}
