// src/scripts/cleanup.ts
import mongoose from "mongoose";
import { StationModel } from "../Models/Station.js";

async function cleanup() {
  const MONGO =  process.env.MONGO_URI
  try {
    await mongoose.connect(MONGO);

    console.log("✅ Connected to MongoDB");

    const result = await StationModel.deleteMany({
      $or: [
        { name: { $exists: false } },
        { location: { $exists: false } },
        { fuel_types: { $exists: false } },
      ],
    });

    console.log(`🧹 Deleted ${result.deletedCount} broken stations`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  }
}

cleanup();
