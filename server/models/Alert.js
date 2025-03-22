import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['low_stock', 'expiring', 'expired', 'reorder'],
    required: true
  },
  priority: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'resolved'],
    default: 'new'
  },
  read: {
    type: Boolean,
    default: false
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  details: {
    currentStock: Number,
    minimumStock: Number,
    reorderLevel: Number,
    expiryDate: Date,
    previousStock: Number,
    testData: String
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ read: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ medicineId: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert; 