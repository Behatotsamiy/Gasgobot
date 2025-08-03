import { MyContext } from "../../types.js";
export declare const adminPendingStations: (ctx: MyContext) => Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare const showStationReview: (ctx: MyContext) => Promise<true | undefined>;
export declare const showTestingStationReview: (ctx: MyContext) => Promise<void>;
export declare const approveStation: (ctx: MyContext) => Promise<true | undefined>;
export declare const setStationToTesting: (ctx: MyContext) => Promise<true | undefined>;
export declare const rejectStation: (ctx: MyContext) => Promise<true | undefined>;
export declare const viewStationLocation: (ctx: MyContext) => Promise<true | undefined>;
