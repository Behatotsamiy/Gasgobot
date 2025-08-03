import { MyContext } from "../../types.js";
export declare const confirmPriceSave: (ctx: MyContext) => Promise<true | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
export declare const cancelPriceSave: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
