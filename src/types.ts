import { Context, session, SessionFlavor } from "grammy";
import { HydrateFlavor } from "@grammyjs/hydrate";

export interface SessionData {
  step?: "name" | "fuel" | "location";
  station: {
    name: string;
    fuel_types: string[];
  };
}

export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;