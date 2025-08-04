import mongoose from "mongoose";
const FeedbackSchema = new mongoose.Schema({
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
export const FeedbackModel = mongoose.model("Feedback", FeedbackSchema);
