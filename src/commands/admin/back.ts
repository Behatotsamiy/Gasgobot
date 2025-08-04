import { MyContext } from "../../types.js";
import { admin } from "./admin.js";

export async function BacktoAdmin(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  try {
    await ctx.deleteMessage();
  } catch {
    console.log("Message delete did not work baka");
  }
  await admin(ctx);
}
