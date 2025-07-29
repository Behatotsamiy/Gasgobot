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

    // 1. Delete test-named stations
    const deletedTests = await StationModel.deleteMany({ name: /test/i });

    // 2. Delete pending and rejected stations
    const deletedPendingRejected = await StationModel.deleteMany({
      status: { $in: ["pending", "rejected"] },
    });

    // 3. Update stations without proper "approved" status to set it
    // This catches: missing field, null, undefined, empty string, or any invalid status
    const updatedStatus = await StationModel.updateMany(
      { 
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: "" },
          { status: { $nin: ["approved", "testing", "pending", "rejected"] } }
        ]
      },
      { $set: { status: "approved" } }
    );

    // 4. Add busyness.level = "green" where it's missing
    const updatedBusyness = await StationModel.updateMany(
      { 
        $or: [
          { busyness: { $exists: false } }, 
          { "busyness.level": { $exists: false } },
          { "busyness.level": null },
          { "busyness.level": "" }
        ] 
      },
      { 
        $set: { 
          "busyness.level": "green",
          "busyness.updatedAt": new Date()
        } 
      }
    );

    // 5. Optional: Log what statuses exist after cleanup
    const statusCounts = await StationModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log(`🧹 Deleted ${deletedTests.deletedCount} test stations`);
    console.log(`🗑️ Deleted ${deletedPendingRejected.deletedCount} pending/rejected stations`);
    console.log(`✅ Updated ${updatedStatus.modifiedCount} stations to approved`);
    console.log(`💚 Set busyness to green on ${updatedBusyness.modifiedCount} stations`);
    console.log(`📊 Current status distribution:`, statusCounts);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  }
}

cleanup();