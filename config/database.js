const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server'); // For testing (optional)

// Configuration
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/slot-machine';
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  reconnectAttempts = 0; // Reset on successful connection
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Attempting reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  } else {
    console.error('Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Main connection function
async function connectDB() {
  try {
    // For development/testing (in-memory DB)
    if (process.env.NODE_ENV === 'test') {
      const mongoServer = await MongoMemoryServer.create();
      const testUri = mongoServer.getUri();
      await mongoose.connect(testUri);
      console.log('TEST MongoDB connected');
      return;
    }

    // Production/development connection
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      socketTimeoutMS: 45000
    });

  } catch (err) {
    console.error('MongoDB initial connection error:', err);
    throw err;
  }
}

module.exports = {
  connectDB,
  mongoose // Export mongoose for transactions if needed
};