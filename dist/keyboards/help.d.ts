import { MyContext } from "../types.ts";
export declare const donateKeyboard: (ctx: MyContext) => Promise<true | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
