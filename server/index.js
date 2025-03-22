import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import medicineRoutes from './routes/medicineRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { checkLowStock, checkExpiry } from './controllers/alertController.js';
import { startAlertScheduler } from './utils/scheduler.js';

// Routes imports will go here

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-inventory', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  startAlertScheduler();
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingsRoutes);

// Routes will go here

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
}); 