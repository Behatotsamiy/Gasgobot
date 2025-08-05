import dotenv from 'dotenv';
import mongoose from "mongoose";
import { UserModel } from "../Models/User.js"

dotenv.config()
const search = process.argv[2]; // e.g., "Shohakbar"

if (!search) {
  console.error("❗ Provide a username or first name to delete.");
  process.exit(1);
}

async function deleteUser() {
  try {
    await mongoose.connect("mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("✅ Connected to MongoDB");

    const result = await UserModel.deleteMany({
      $or: [
        { username: search },
        { first_name: search },
      ],
    });

    if (result.deletedCount === 0) {
      console.log("⚠️ No matching user found.");
    } else {
      console.log(`🗑️ Deleted ${result.deletedCount} user(s) matching "${search}"`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    process.exit(1);
  }
}

deleteUser();
