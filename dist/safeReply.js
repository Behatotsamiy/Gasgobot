export async function safeReply(ctx, text, options) {
    try {
        await ctx.reply(text, options);
    }
    catch (err) {
        console.warn("📵 Reply error (возможно заблокировал):", err);
    }
}
