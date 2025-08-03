import { MyContext } from "../types.js";
export declare const ADMINS: number[];
export declare function requireAdmin(handler: (ctx: MyContext) => Promise<unknown>): (ctx: MyContext) => Promise<unknown>;
