import mongoose from 'mongoose';

// Destructure the MongoDB credentials from environment variables
const {
  MONGODB_USERNAME = 'afaqaffo17',
  MONGODB_PASSWORD = '112233445566',
  MONGODB_CLUSTER = 'iotcluster.bhttif0.mongodb.net',
  MONGODB_DATABASE = 'IotSaas_app',
} = process.env;

// Construct the MongoDB connection string using the destructured variables
const connectionString = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;

// Check if the connection string is correctly formed
if (!connectionString) {
  throw new Error('MongoDB connection string is missing.');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToMongo() {
  // Use cached connection if available
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // Establish a new connection if no cached connection exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DATABASE, // Use the database name provided in env
    };

    console.log(`🌐 Connecting to MongoDB at ${MONGODB_DATABASE}`);
    cached.promise = mongoose.connect(connectionString, opts)
      .then((mongooseInstance) => {
        console.log('✅ Connected to MongoDB successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error('❌ Failed to resolve MongoDB promise:', err);
    throw err;
  }
}

// Connection events for logging
mongoose.connection.on('connected', () => {
  console.log('🔌 MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error(`⚠️ MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔒 MongoDB connection closed due to app termination');
  process.exit(0);
});

// Export the mongoose instance for use elsewhere in your app
export { mongoose };
