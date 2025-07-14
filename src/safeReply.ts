// utils/safeReply.ts
import { MyContext } from "./types.js";

export async function safeReply(
  ctx: MyContext,
  text: string,
  options?: Parameters<MyContext["reply"]>[1]
) {
  try {
    await ctx.reply(text, options);
  } catch (err) {
    console.warn("📵 Reply error (возможно заблокировал):", err);
  }
}
