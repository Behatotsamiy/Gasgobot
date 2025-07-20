import { MyContext } from "../../types.ts";
import { UserModel } from "../../Models/User.ts";
import { admin } from "../admin/admin.ts";
import { broadcastMap } from "../../utils/broadcastMap.ts"; // ⬅️ make sure it's imported from shared file

export async function confirmBroadcast(ctx: MyContext) {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();

  const userId = ctx.from?.id;
  if (!userId) {
    console.log("❌ No ctx.from found.");
    return ctx.reply("⚠️ Unexpected error. Try again.");
  }

  const text = broadcastMap.get(userId);

  console.log("User ID:", userId);
  console.log("broadcastMap contents:", broadcastMap);

  if (!text) {
    console.log("❌ No text found in broadcastMap.");
    return ctx.reply(
      "⚠️ No broadcast message found. Please restart the broadcast."
    );
  }

  const users = await UserModel.find();
  console.log(`Sending to ${users.length} users`);

  let success = 0,
    fail = 0;

  for (const user of users) {
    try {
      await ctx.api.sendMessage(user.telegramId, text);
      success++;
    } catch (e) {
      console.log("Failed to send to", user.telegramId, e);
      fail++;
    }
  }

  broadcastMap.delete(userId);

  await ctx.reply(`📢 Broadcast finished.\n✅ Sent: ${success}\n❌ Failed: ${fail}`);

  await admin(ctx);
}
