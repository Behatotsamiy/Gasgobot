import mongoose, { Document, ObjectId } from "mongoose";
export interface Station extends Document {
    name: string;
    fuel_types: string[];
    location: {
        lat: number;
        lng: number;
    };
    pricing: {
        [fuelType: string]: number;
    };
    owner?: ObjectId;
    submittedBy?: ObjectId;
    status: "pending" | "approved" | "rejected" | "testing";
    isOwnerSubmission: boolean;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: ObjectId;
    busyness: {
        level: "green" | "orange" | "red";
        updatedAt: Date;
        expiresAt?: Date;
    };
}
export declare const StationModel: mongoose.Model<Station, {}, {}, {}, mongoose.Document<unknown, {}, Station, {}> & Station & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
