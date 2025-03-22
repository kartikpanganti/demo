import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['antibiotics', 'painkillers', 'vitamins', 'antiviral', 'anticold', 'antidiabetic', 'cardiovascular', 'gastrointestinal', 'respiratory', 'other'],
    default: 'other'
  },
  therapeuticCategory: {
    type: String,
    required: true,
    enum: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Antihypertensives', 'Antihistamines', 'Antipyretics', 'Antacids', 'Antidepressants', 'Antifungals', 'Antivirals', 'Vitamins', 'Supplements']
  },

  // Manufacturer & Supply
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    index: true  // Adding index for fast barcode lookups
  },
  barcodeType: {
    type: String,
    enum: ['EAN-13', 'CODE128', 'QR', 'custom'],
    default: 'CODE128'
  },
  barcodeGenerated: {
    type: Date
  },
  lastScanned: {
    type: Date
  },
  scanHistory: [{
    action: {
      type: String,
      enum: ['check', 'stock_in', 'stock_out', 'verify'],
      required: true
    },
    quantity: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    scannedBy: String
  }],

  // Product Details
  dosageForm: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Ointment', 'Gel', 'Drops', 'Inhaler', 'Patch', 'Suppository']
  },
  strength: {
    type: String,
    trim: true
  },
  packageSize: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    default: 'tablet',
    enum: ['tablet', 'bottle', 'strip', 'box', 'vial', 'ampule', 'tube', 'sachet', 'capsule', 'other']
  },

  // Stock & Price
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative']
  },
  minimumStock: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  reorderLevel: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },

  // Dates
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },

  // Medical Information
  description: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  contraindications: {
    type: String,
    trim: true
  },
  storageInstructions: {
    type: String,
    trim: true
  },
  usageInstructions: {
    type: String,
    trim: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  controlledSubstance: {
    type: Boolean,
    default: false
  },

  // Additional Notes
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
medicineSchema.index({ name: 1, barcode: 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ stock: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ therapeuticCategory: 1 });
medicineSchema.index({ manufacturer: 1 });
medicineSchema.index({ supplier: 1 });

// Virtual for checking if medicine is expired
medicineSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for checking if medicine is low in stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minimumStock;
});

// Virtual for days until expiry
medicineSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const diffTime = Math.abs(expiryDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtuals are included when converting to JSON
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

// Add method to record scan
medicineSchema.methods.recordScan = async function(action, quantity = 0, notes = '', scannedBy = 'system') {
  this.lastScanned = new Date();
  this.scanHistory.push({
    action,
    quantity,
    notes,
    scannedBy,
    timestamp: new Date()
  });
  
  // IMPORTANT: Don't update stock here for 'stock_out' action that comes from sales
  // as the saleController already updates the stock directly
  if (action === 'stock_in') {
    this.stock += quantity;
  } else if (action === 'stock_out' && !notes.includes('Sold in invoice')) {
    // Only reduce stock if this is NOT from a sale (which would already have reduced stock)
    this.stock = Math.max(0, this.stock - quantity);
  }
  
  return this.save();
};

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine; 