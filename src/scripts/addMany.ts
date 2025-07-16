import mongoose from "mongoose";
import { StationModel } from "../Models/Station.js"; // adjust path if needed

const MONGO_URI = "mongodb+srv://bahtiyorov757:password757@cluster0.ycr0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // change to your DB

const stations = [
  {
    name: "Poytaxt Oil 2",
    location: { lat: 41.2948, lng: 69.29077 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Rs",
    location: { lat: 41.30694, lng: 69.30996 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.28695, lng: 69.28263 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "So Petrol",
    location: { lat: 41.31606, lng: 69.31607 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Geksan Service",
    location: { lat: 41.28888, lng: 69.30229 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.32924, lng: 69.3132 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.34084, lng: 69.29954 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.29884, lng: 69.23807 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Tatneft",
    location: { lat: 41.31508, lng: 69.23462 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel", "Metan"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.31412, lng: 69.328 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Intran Servis",
    location: { lat: 41.31718, lng: 69.22983 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Oktan",
    location: { lat: 41.27798, lng: 69.30707 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Uzbekneftegaz",
    location: { lat: 41.35095, lng: 69.28622 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Mirhosil",
    location: { lat: 41.34828, lng: 69.25595 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Mustang",
    location: { lat: 41.26878, lng: 69.28904 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Oil Union",
    location: { lat: 41.35394, lng: 69.26641 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Perfect Petrol",
    location: { lat: 41.34794, lng: 69.24708 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "H Petrol",
    location: { lat: 41.32959, lng: 69.22513 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Poytaxt Oil",
    location: { lat: 41.34824, lng: 69.31538 },
    fuel_types: ["AI-80", "AI-92", "AI-95", "Dizel"]
  },
  {
    name: "Mustang",
    location: { lat: 41.2787, lng: 69.32382 },
    fuel_types: ["AI-92", "AI-95", "Dizel"]
  }
]



const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await StationModel.insertMany(stations);
    console.log("✅ Done.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
};

main();
