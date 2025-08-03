import { MyContext } from '../../types.ts';
export declare function Busyness(ctx: MyContext): Promise<(import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message) | undefined>;
export declare function ChangeBusyness(ctx: MyContext): Promise<void | (import("@grammyjs/types").Message.CommonMessage & {
    text: string;
} & import("@grammyjs/hydrate/out/data/message.js").MessageXFragment & import("@grammyjs/types").Message)>;
