import mongoose, { Document } from "mongoose";
export interface User extends Document {
    telegramId: number;
    firstName: string;
    username: string;
    phone_number: string;
    location: {
        lat: number;
        lng: number;
    };
    createdAt: Date;
}
export declare const UserModel: mongoose.Model<User, {}, {}, {}, mongoose.Document<unknown, {}, User, {}> & User & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
