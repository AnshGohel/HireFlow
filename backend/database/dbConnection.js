import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const dbConnection = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: "Job_Portal",
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(process.env.DB_URL, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB Connected Sucessfully !");
        return mongooseInstance;
      })
      .catch((error) => {
        console.log(`Failed to connect ${error}`);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default dbConnection;
