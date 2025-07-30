import mongoose, { Document } from "mongoose";

export interface Feedback extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const FeedbackSchema = new mongoose.Schema<Feedback>({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: mongoose.SchemaTypes.String,
    required: true,
    maxlength: 300,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
});

export const FeedbackModel = mongoose.model<Feedback>("Feedback", FeedbackSchema);
