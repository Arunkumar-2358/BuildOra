import mongoose from "mongoose";

let memoryServer;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri && process.env.NODE_ENV !== "production") {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log("MongoDB memory server started for local development");
    }

    if (!mongoUri) {
      throw new Error("MONGO_URI is required in production");
    }

    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};
