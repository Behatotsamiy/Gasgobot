import { MyContext } from "../types.js";
export declare const start: (ctx: MyContext) => Promise<void | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
