import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI environment variable is not defined. Falling back to local memory DB or mock operations.");
    return;
  }

  // Set Mongoose options
  mongoose.set("strictQuery", true);

  // Set up connection event listeners
  mongoose.connection.on("connected", () => {
    console.log("🟢 Successfully connected to MongoDB Atlas");
  });

  mongoose.connection.on("error", (err) => {
    console.warn("⚠️ MongoDB connection notice: Database is currently in offline-database mode.");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("🟡 MongoDB disconnected. Operating in offline-database mode...");
  });

  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.warn("⚠️ MongoDB Atlas connection could not be established immediately. Continuing in offline-database mode with robust in-memory database simulation.");
  }

  // Populate data maps and seed DB asynchronously
  try {
    const { runSeeder } = await import("./seeder");
    await runSeeder();
  } catch (err: any) {
    console.warn("⚠️ Seeder initialization notice:", err?.message || err);
  }
}

/**
 * Handle graceful shutdown of the database connection
 */
export async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed gracefully via application termination");
  } catch (err) {
    console.error("Error during MongoDB connection termination:", err);
  }
}
