import { Context } from "grammy";
import { HydrateFlavor } from "@grammyjs/hydrate";
export interface SessionData {
    step?: string;
    station?: {
        name: string;
        fuel_types: string[];
        location: {
            lat: number;
            lng: number;
        };
    };
    editingStationId?: unknown;
    awaitingBroadcast?: boolean;
    broadcastPreview?: string;
    prevMenu?: "fuel_menu" | "station_menu" | "help_menu" | "stations";
    selectedStationIds?: string[];
    selectedStation?: any;
    availableFuels?: string[];
    currentFuelIndex?: number;
    pendingPrices?: {
        [fuelType: string]: number;
    };
    currentFuel?: string;
    currentStationId?: string;
    lastLocationMsgId?: number;
}
export type MyContext = HydrateFlavor<Context & {
    session: SessionData;
}>;
