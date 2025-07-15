import { InlineKeyboard } from "grammy";


export const fuelKeyboard =  new InlineKeyboard()
      .text("⛽ AI-80", "fuel:AI-80")
      .text("⛽ AI-91", "fuel:AI-91").row()
      .text("⛽ AI-92", "fuel:AI-92")
      .text("⛽ AI-95", "fuel:AI-95").row()
      .text("⛽ AI-98", "fuel:AI-98")
      .text("⚡ Elektr", "fuel:Elektrik").row()
      .text("🛢 Dizel", "fuel:Dizel")
      .text("🔥 Propan", "fuel:Propan").row()
      .text("💨 Metan", "fuel:Metan").row()
      .text("Profil", "profile").row()
      .text("❤️Proyekt rivoji uchun yordam", "donate")