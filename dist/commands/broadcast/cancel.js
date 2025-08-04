import { admin } from "../admin/admin.js";
import { broadcastMap } from "../../utils/broadcastMap.js";
export async function cancelBroadcast(ctx) {
    await ctx.answerCallbackQuery("Broadcast cancelled");
    try {
        await ctx.deleteMessage();
    }
    catch {
        console.log("Message delete did not work baka");
    }
    if (ctx.from)
        broadcastMap.delete(ctx.from?.id);
    admin(ctx);
}
