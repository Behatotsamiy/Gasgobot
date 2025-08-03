import { MyContext } from "../types.js";
export declare const addStation: (ctx: MyContext) => Promise<void>;
export declare const handleAddStationName: (ctx: MyContext) => Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare const handleStationLocation: (ctx: MyContext) => Promise<boolean | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
export declare const handleStationCallbacks: (ctx: MyContext) => Promise<true | (import("@grammyjs/types").Update.Edited & import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
