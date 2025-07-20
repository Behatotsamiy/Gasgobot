import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { StationModel } from "../Models/Station.js";

async function cleanup() {
  const MONGO = process.env.MONGO_URI;

  if (!MONGO) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO);
    console.log("✅ Connected to MongoDB");

    const result = await StationModel.deleteMany({
      name: { $regex: /test/i }  // case-insensitive match
    });

    console.log(`🧹 Deleted ${result.deletedCount} broken stations`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  }
}

cleanup();
