import { MyContext } from "../../types.ts";
import { admin } from "./admin.ts";

export async function BacktoAdmin(ctx:MyContext) {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
    await admin(ctx);
}