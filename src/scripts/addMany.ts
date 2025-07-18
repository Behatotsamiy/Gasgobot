import mongoose from "mongoose";
import { StationModel } from "../Models/Station.js"; // adjust path if needed

const MONGO = process.env.MONGO_URI

const stations = [
  {}
]



const main = async () => {
  try {
    await mongoose.connect(MONGO);
    await StationModel.insertMany(stations);
    console.log("✅ Done.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
};

main();
