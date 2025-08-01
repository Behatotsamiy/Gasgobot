import { MyContext } from "../../types.ts";
import { admin } from "./admin.ts";

export async function BacktoAdmin(ctx:MyContext) {
    await ctx.answerCallbackQuery();
    try{await ctx.deleteMessage()}catch{console.log("Message delete did not work baka")}
    await admin(ctx);
}