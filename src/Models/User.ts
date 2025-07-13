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

const UserSchema = new mongoose.Schema<User>({
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
    lat:{
      type: mongoose.SchemaTypes.Number
    }
  }
}, {
    timestamps: true,
    versionKey: false
});

export const UserModel = mongoose.model<User>("User", UserSchema);