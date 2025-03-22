import mongoose from 'mongoose';

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-inventory', options);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Check connection status
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected, attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

export { connectDB, isConnected }; 