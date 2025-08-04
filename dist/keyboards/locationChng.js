export async function locationChangeAccept(ctx) {
    try {
        await ctx.deleteMessage(); // 🗑️ Deletes the button/message
    }
    catch (e) {
        console.warn("⚠️ Failed to delete message:", e);
    }
    await ctx.reply("📍 Iltimos, yangi joylashuvingizni yuboring.", {
        reply_markup: {
            keyboard: [[{ text: "📍 Joylashuv yuborish", request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}
