import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments', 'Drops', 'Inhalers', 'Patches', 'Suppositories', 'Solutions']
  },
  therapeuticCategory: {
    type: String,
    required: true,
    enum: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Antihypertensives', 'Antihistamines', 'Antipyretics', 'Antacids', 'Antidepressants', 'Antifungals', 'Antivirals', 'Vitamins', 'Supplements']
  },

  // Manufacturer & Supply
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
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
    required: true,
    enum: ['Tablets', 'Capsules', 'Bottles', 'Tubes', 'Pieces', 'Strips', 'Vials', 'Ampoules', 'ml', 'mg', 'g']
  },

  // Stock & Price
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
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
    required: true
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

// Add methods to check medicine status
medicineSchema.methods.isLowStock = function() {
  return this.stock <= this.minimumStock;
};

medicineSchema.methods.needsReorder = function() {
  return this.stock <= this.reorderLevel;
};

medicineSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

medicineSchema.methods.isExpiringSoon = function(days = 30) {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + days);
  return this.expiryDate <= expiryThreshold && !this.isExpired();
};

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
  
  if (action === 'stock_in') {
    this.stock += quantity;
  } else if (action === 'stock_out') {
    this.stock = Math.max(0, this.stock - quantity);
  }
  
  return this.save();
};

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine; 