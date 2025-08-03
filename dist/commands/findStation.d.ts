import { MyContext } from "../types.js";
export declare const findStation: (ctx: MyContext) => Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
