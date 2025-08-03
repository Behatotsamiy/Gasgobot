import { MyContext } from "../../types.ts";
type stn = {
    _id: unknown;
    name: string;
    fuel_types: string[];
    status: string;
    location: {
        lat: number;
        lng: number;
    };
    pricing: Map<string, number> | {
        [key: string]: number;
    };
    busyness_level?: string;
};
export declare function Stationlong(station: stn, ctx: MyContext): Promise<import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message>;
export declare function editStation(ctx: MyContext, id: unknown, call: string | undefined): Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare function handleEditFuelSelection(ctx: MyContext, fuelType: string): Promise<true | undefined>;
export declare function handleFuelDone(ctx: MyContext): Promise<true | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
export declare function handleStationNameUpdate(ctx: MyContext, newName: string): Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare function handleStationLocationUpdate(ctx: MyContext, locationInput: string): Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export {};
