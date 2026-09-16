import mongoose from "mongoose";
import dns from "dns";

/*
 * Use reliable public DNS resolvers.
 * This helps when the hosting environment has
 * DNS resolution issues with MongoDB Atlas SRV records.
 */
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(
      `MongoDB Connected: ${mongoose.connection.host}`
    );

    /*
     * Connection event handlers.
     */
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);

    /*
     * Exit so the hosting platform can restart the
     * application instead of running without a database.
     */
    process.exit(1);
  }
};

export default connectDB;