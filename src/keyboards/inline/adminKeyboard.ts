import { InlineKeyboard } from "grammy";

export const adminKeyboard = new InlineKeyboard()
  .text("📊 Stats", "admin_stats")
  .text("👤 Users", "admin_users")
  .row()
  .text("🔄 Broadcast", "admin_broadcast")
  .text("⚙️ Settings", "admin_settings");


