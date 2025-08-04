import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
    telegramId: {
        type: mongoose.SchemaTypes.Number,
        required: [true, "Telegram ID is required"],
        unique: true
    },
    firstName: {
        type: mongoose.SchemaTypes.String,
    },
    username: {
        type: mongoose.SchemaTypes.String,
    },
    phone_number: {
        type: mongoose.SchemaTypes.String,
    },
    location: {
        lng: {
            type: mongoose.SchemaTypes.Number
        },
        lat: {
            type: mongoose.SchemaTypes.Number
        }
    },
}, {
    timestamps: true,
    versionKey: false
});
export const UserModel = mongoose.model("User", UserSchema);
