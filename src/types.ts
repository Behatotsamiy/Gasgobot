import { Context, session, SessionFlavor } from "grammy";
import { HydrateFlavor } from "@grammyjs/hydrate";

export interface SessionData {
  step?: string;
  station?: { 
    name: string; 
    fuel_types: string[];
    location?: { lat: number; lng: number }; // Add this
  };
  awaitingBroadcast?: boolean;
  broadcastPreview?: string;
  prevMenu?: "fuel_menu" | "station_menu";
}


export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;