import mongoose, { Document, ObjectId } from "mongoose";

export interface Station extends Document {
  name: string;
  fuel_types: string[];
  location: {
    lat: number;
    lng: number;
  };
  owner: ObjectId
  createdAt: Date;
}

const StationSchema = new mongoose.Schema<Station>({
  name: {
    type: mongoose.SchemaTypes.String
  },
  fuel_types: {
    type: [mongoose.SchemaTypes.String],
  },
  location:{
    lng:{
     type: mongoose.SchemaTypes.Number
     
    },
    lat:{
      type: mongoose.SchemaTypes.Number
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, {
    timestamps: true,
    versionKey: false
});

export const StationModel = mongoose.model<Station>("Station", StationSchema);