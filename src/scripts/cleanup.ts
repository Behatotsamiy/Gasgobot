// src/scripts/cleanup.ts
import mongoose from "mongoose";
import { StationModel } from "../Models/Station.js";

async function cleanup() {
  try {
    await mongoose.connect("mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

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
