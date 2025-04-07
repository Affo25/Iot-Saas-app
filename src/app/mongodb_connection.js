import mongoose from 'mongoose';

// Connection URI and DB Name from environment variables
const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017";
const dbName = process.env.MONGODB_DB || "IotSaas";

let cachedDb = null;

export async function connectToMongo() {
  if (cachedDb) {
    console.log('Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    // Establish connection to MongoDB
    await mongoose.connect(uri, {
      dbName: dbName, // Set database name here
    });

    console.log("Connected to MongoDB");

    // Assign the connection to the cachedDb variable
    cachedDb = mongoose.connection;

    // Connection success
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    // Connection error
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
      throw err;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return cachedDb;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Export the connection instance if needed elsewhere
export { mongoose };
