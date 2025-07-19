import { MyContext } from "../../types.ts";
import { admin } from "../admin/admin.ts";
import { broadcastMap } from "../../utils/broadcastMap.ts";

export async function cancelBroadcast(ctx: MyContext) {
  await ctx.answerCallbackQuery("Broadcast cancelled");
  await ctx.deleteMessage();
  broadcastMap.delete(ctx.from?.id);
  admin(ctx);
}
