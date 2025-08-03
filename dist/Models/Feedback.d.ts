import mongoose, { Document } from "mongoose";
export interface Feedback extends Document {
    user: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
}
export declare const FeedbackModel: mongoose.Model<Feedback, {}, {}, {}, mongoose.Document<unknown, {}, Feedback, {}> & Feedback & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
