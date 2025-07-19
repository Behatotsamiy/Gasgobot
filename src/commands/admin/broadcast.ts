import { MyContext } from "../../types.ts";

export async function AdminBroadcast(ctx:MyContext){
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("📝 Please send the message you want to broadcast to all users.");
    ctx.session.awaitingBroadcast = true;
}