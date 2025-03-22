import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required']
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if email is not empty
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: props => 'Please enter a valid email address'
    }
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  customer: {
    type: customerSchema,
    required: [true, 'Customer details are required']
  },
  items: {
    type: [saleItemSchema],
    required: [true, 'Sale items are required'],
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subTotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax is required'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Card', 'UPI', 'Other'],
    default: 'Cash'
  },
  note: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Cancelled'],
    default: 'Completed'
  }
}, {
  timestamps: true
});

// Virtual for total items count
saleSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

// Virtual for formatted date
saleSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON output
saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

// Create indexes for common queries
saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'customer.name': 1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index({ total: 1 });

// Generate invoice number based on date and counter
saleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Find the latest invoice with the same date prefix
    const latestSale = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^${datePrefix}`)
    }).sort({ invoiceNumber: -1 });
    
    let counter = 1;
    if (latestSale && latestSale.invoiceNumber) {
      // Extract the counter from the latest invoice number
      const latestCounter = parseInt(latestSale.invoiceNumber.substring(8));
      counter = isNaN(latestCounter) ? 1 : latestCounter + 1;
    }
    
    this.invoiceNumber = `${datePrefix}${counter.toString().padStart(4, '0')}`;
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale; 