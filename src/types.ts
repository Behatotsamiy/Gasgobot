import { Context, session, SessionFlavor } from "grammy";
import { HydrateFlavor } from "@grammyjs/hydrate";

export interface SessionData {
  step?: string;
  station?: { name: string; fuel_types: string[] };
  awaitingBroadcast?: boolean;
  broadcastPreview?: string;
}



export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;