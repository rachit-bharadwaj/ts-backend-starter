import mongoose from "mongoose";
import { MONGO_URI } from "../../constants/config";

let cached = (global as any).mongoose || { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) {
    console.log("Using cached DB connection");
    return cached.conn;
  }

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing in the environment variables");
  }

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });

  cached.conn = await cached.promise;
  console.log("New DB connection created");
  return cached.conn;
};

export default connectDB;
