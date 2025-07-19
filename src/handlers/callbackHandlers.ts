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
  handleFuelSelection,
  showFuelSelection,
  location_change,
  locationChangeAccept,
} from "../keyboards/_index.ts";
import { profile } from "../commands/profile.ts";
import { Stats } from "../commands/admin/stats.ts";
import { admin, findStation } from "../commands/_index.ts";
import { adminUsersHandler } from "../commands/admin/users.ts"; // ✅ Add this line
import { BacktoAdmin } from "../commands/admin/back.ts";
import { AdminBroadcast } from "../commands/admin/broadcast.ts";
import { requireAdmin } from "../utils/requireAdmin.ts";


const callbackHandlers: Record<string, (ctx: MyContext) => Promise<unknown>> = {
  profile,
  backToMenu: backToMenuKeyboard,
  donate: donateKeyboard,
  money: moneyKeyboard,
  addStationKB: addStation,
  "menu:fuel": showFuelSelection,
  location_change: location_change,
  "location:yes": locationChangeAccept,

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

  // ✅ Handle exact match
  const handler = callbackHandlers[data];
  if (handler) return handler(ctx);

  if (/^admin_users(\?page=\d+)?$/.test(data)) {
    return requireAdmin(adminUsersHandler)(ctx);
  }
  

  // ✅ Dynamic: fuel:<type>[:index][:showMore]
  if (/^fuel:.+/.test(data)) {
    return findStation(ctx);
  }

  return ctx.answerCallbackQuery({ text: "Unknown action", show_alert: true });
}
