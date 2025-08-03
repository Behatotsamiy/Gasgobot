import { MyContext } from "../types.js";
export declare const moneyKeyboard: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
