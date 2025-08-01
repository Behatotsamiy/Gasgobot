import mongoose, { Document, ObjectId } from "mongoose";

export interface Station extends Document {
  name: string;
  fuel_types: string[];
  location: {
    lat: number;
    lng: number;
  };
  pricing: {
    [fuelType: string]: number; // e.g., { "AI-92": 10500 }
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

const StationSchema = new mongoose.Schema<Station>(
  {
    name: {
      type: mongoose.SchemaTypes.String,
      required: true,
    },
    fuel_types: {
      type: [mongoose.SchemaTypes.String],
      required: true,
    },
    location: {
      lng: {
        type: mongoose.SchemaTypes.Number,
        required: true,
      },
      lat: {
        type: mongoose.SchemaTypes.Number,
        required: true,
      },
    },
    pricing: {
      type: Map,
      of: Number,
      default: {}, // Optional
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: mongoose.SchemaTypes.String,
      enum: ["pending", "approved", "rejected", "testing"],
      default: "pending",
    },
    isOwnerSubmission: {
      type: mongoose.SchemaTypes.Boolean,
      default: false,
    },
    reviewedAt: {
      type: mongoose.SchemaTypes.Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    busyness: {
      level: {
        type: String,
        enum: ["green", "orange", "red"],
        required: false, 
        default: undefined, 
      },      
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const StationModel = mongoose.model<Station>("Station", StationSchema);
