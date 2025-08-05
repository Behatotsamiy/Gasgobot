import mongoose from "mongoose";
import { UserModel } from "../Models/User.js";

async function allUsers() {
  try {
    await mongoose.connect(
      "mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ Connected to MongoDB");

    const users = await UserModel.find({});
    if (users.length === 0) {
      console.log("⚠️ No users found in the database.");
    } else {
      console.log("📋 All users:");
      users.forEach((u, i) => {
        console.log(
          `${i + 1}. ID: ${u.telegramId || u.id} | Username: ${u.username} , first name ${u.firstName}`
        );
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    process.exit(1);
  }
}

allUsers();
