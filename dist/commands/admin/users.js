import { InlineKeyboard } from "grammy";
import { UserModel } from "../../Models/User.js";
export async function adminUsersHandler(ctx) {
    const USERS_PER_PAGE = 5;
    const match = ctx.callbackQuery?.data?.match(/^admin_users(\?page=(\d+))?$/);
    const page = parseInt(match?.[2] || "0", 10);
    const skip = page * USERS_PER_PAGE;
    const users = await UserModel.find().skip(skip).limit(USERS_PER_PAGE);
    const total = await UserModel.countDocuments();
    if (users.length === 0) {
        await ctx.answerCallbackQuery();
        return ctx.editMessageText("⚠️ No users found.");
    }
    let text = `📋 Users (Page ${page + 1}):\n\n`;
    users.forEach((u, i) => {
        text += `${skip + i + 1}. ID: ${u.telegramId || u.id}\n   Username: @${u.username || "—"}\n   Name: ${u.firstName || "—"}\n\n`;
    });
    const keyboard = new InlineKeyboard();
    if (page > 0)
        keyboard.text("⏮️ Previous", `admin_users?page=${page - 1}`);
    if ((page + 1) * USERS_PER_PAGE < total)
        keyboard.text("⏭️ Next", `admin_users?page=${page + 1}`);
    keyboard.row().text("⬅️ Back to Admin Panel", "admin_panel");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { reply_markup: keyboard });
}
