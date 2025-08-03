import { MyContext } from "../../types.ts";
import { admin } from "../admin/admin.ts";
import { broadcastMap } from "../../utils/broadcastMap.ts";

export async function cancelBroadcast(ctx: MyContext) {
  await ctx.answerCallbackQuery("Broadcast cancelled");
  try {
    await ctx.deleteMessage();
  } catch {
    console.log("Message delete did not work baka");
  }

  if (ctx.from) broadcastMap.delete(ctx.from?.id);

  admin(ctx);
}
