import { admin } from "./admin.js";
export async function BacktoAdmin(ctx) {
    await ctx.answerCallbackQuery();
    try {
        await ctx.deleteMessage();
    }
    catch {
        console.log("Message delete did not work baka");
    }
    await admin(ctx);
}
