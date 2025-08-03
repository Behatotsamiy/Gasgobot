import { MyContext } from "../types.js";
export declare const backToMenuKeyboard: (ctx: MyContext) => Promise<true | void | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
