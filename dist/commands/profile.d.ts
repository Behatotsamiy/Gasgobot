import { MyContext } from "../types.js";
export declare const profile: (ctx: MyContext) => Promise<(true | (import("@grammyjs/types").Update.Edited & import("@grammyjs/types").Message.CommonMessage & {
    text: string;
})) & (true | import("@grammyjs/hydrate/out/data/message.js").MessageX)>;
