import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './utils/db.js';
import medicineRoutes from './routes/medicineRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import { startAlertScheduler } from './utils/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Apply middleware to handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON format' });
  }
  next(err);
});

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sales', saleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors
    });
  }
  
  // MongoDB cast errors (usually invalid IDs)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      message: `Duplicate value for ${field}: ${err.keyValue[field]}`
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Start server
const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  const isConnected = await connectDB();
  
  if (isConnected) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      // Start alert scheduler
      startAlertScheduler();
    });
  } else {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }
};

startServer(); 