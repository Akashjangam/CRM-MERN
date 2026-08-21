import mongoose from "mongoose";
import dns from "dns";

// Set DNS servers before connecting to MongoDB Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error.message);
  }
};

export default connectDB;