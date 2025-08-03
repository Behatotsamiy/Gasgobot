import { MyContext } from "../../types.ts";
export declare function stationInfo(ctx: MyContext): Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare function handleStationMainMenu(ctx: MyContext): Promise<true | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare const userStationInfo: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const stationChange: (ctx: MyContext) => Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare const deleteStation: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const pricelist: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const changePrice: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const handleFuelPriceInput: (ctx: MyContext, priceText: string) => Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare const skipFuelPrice: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const confirmPriceSave: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const cancelPriceSave: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const currentPrices: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const handleMyPrices: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const handleCompetitorPrices: (ctx: MyContext) => Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare const gasInfo: (ctx: MyContext) => Promise<void>;
export declare const workTime: (ctx: MyContext) => Promise<void>;
export declare const showStationSelectionForPrices: (ctx: MyContext) => Promise<void>;
export declare const toggleStation: (ctx: MyContext) => Promise<void>;
export declare const confirmStationSelection: (ctx: MyContext) => Promise<void>;
