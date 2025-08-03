import { MyContext } from "../../types.js";
export declare function adminUsersHandler(ctx: MyContext): Promise<true | (import("@grammyjs/types").Update.Edited & import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
