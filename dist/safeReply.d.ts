import { MyContext } from "./types.js";
export declare function safeReply(ctx: MyContext, text: string, options?: Parameters<MyContext["reply"]>[1]): Promise<void>;
