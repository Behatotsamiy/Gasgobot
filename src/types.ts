import { Context } from "grammy";

export interface SessionData {
  step?: string;
  station?: { 
    name: string; 
    fuel_types: string[];
    location: { lat: number; lng: number }; // location is required
  };
  editingStationId?: unknown;
  awaitingBroadcast?: boolean;
  broadcastPreview?: string;
  prevMenu?: "fuel_menu" | "station_menu";
}

export type MyContext = Context & {
  session: SessionData;
};
