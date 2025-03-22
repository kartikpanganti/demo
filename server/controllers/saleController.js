import Sale from '../models/Sale.js';
import Medicine from '../models/Medicine.js';

// Create a new sale
export const createSale = async (req, res) => {
  try {
    const { customer, items, subTotal, tax, discount, total, paymentMethod, note } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Sale items are required' });
    }

    // Generate invoice number
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Find the latest invoice with the same date prefix
    const latestSale = await Sale.findOne({
      invoiceNumber: new RegExp(`^${datePrefix}`)
    }).sort({ invoiceNumber: -1 });
    
    let counter = 1;
    if (latestSale && latestSale.invoiceNumber) {
      // Extract the counter from the latest invoice number
      const latestCounter = parseInt(latestSale.invoiceNumber.substring(8));
      counter = isNaN(latestCounter) ? 1 : latestCounter + 1;
    }
    
    const invoiceNumber = `${datePrefix}${counter.toString().padStart(4, '0')}`;

    // Create a new sale instance
    const newSale = new Sale({
      invoiceNumber,
      customer,
      items,
      subTotal,
      tax,
      discount,
      total,
      paymentMethod,
      note
    });

    // Update inventory for each item sold
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine with ID ${item.medicine} not found` });
      }

      // Check if enough stock is available
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}` 
        });
      }

      // Reduce stock by the exact quantity sold
      medicine.stock -= item.quantity;
      console.log(`Reducing stock for ${medicine.name} by ${item.quantity}. New stock: ${medicine.stock}`);
      await medicine.save();
      
      // Record the scan for history/tracking purposes
      // Note: recordScan is modified to avoid double stock reduction for sale operations
      if (typeof medicine.recordScan === 'function') {
        await medicine.recordScan('stock_out', item.quantity, `Sold in invoice ${invoiceNumber}`);
      }
    }

    // Save the sale
    const savedSale = await newSale.save();
    res.status(201).json({
      _id: savedSale._id,
      invoiceNumber: savedSale.invoiceNumber,
      total: savedSale.total,
      message: 'Sale completed successfully'
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

// Get all sales with pagination and filtering
export const getAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const paymentMethod = req.query.paymentMethod || null;
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount) : null;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount) : null;

    // Build filter
    const filter = {};
    
    if (searchQuery) {
      filter.$or = [
        { invoiceNumber: { $regex: searchQuery, $options: 'i' } },
        { 'customer.name': { $regex: searchQuery, $options: 'i' } },
        { 'customer.contact': { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (startDate && endDate) {
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.createdAt = { $gte: startDate };
    } else if (endDate) {
      filter.createdAt = { $lte: endDate };
    }
    
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    
    if (minAmount !== null || maxAmount !== null) {
      filter.total = {};
      if (minAmount !== null) filter.total.$gte = minAmount;
      if (maxAmount !== null) filter.total.$lte = maxAmount;
    }

    // Execute query with pagination
    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalSales = await Sale.countDocuments(filter);
    const totalPages = Math.ceil(totalSales / limit);
    
    res.json({
      sales,
      totalPages,
      currentPage: page,
      totalSales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Error fetching sales', error: error.message });
  }
};

// Get sale by ID
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ message: 'Error fetching sale', error: error.message });
  }
};

// Get sales stats
export const getSalesStats = async (req, res) => {
  try {
    const timeFrame = req.query.timeFrame || 'today';
    let startDate, endDate = new Date();
    
    // Calculate start date based on time frame
    const now = new Date();
    switch (timeFrame) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    // Get total sales count
    const totalSalesCount = await Sale.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Get total sales amount
    const salesData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          avgSaleValue: { $avg: '$total' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);
    
    // Get payment method breakdown
    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$total' }
        }
      }
    ]);
    
    // Get top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalAmount: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    // Format stats object
    const stats = {
      timeFrame,
      period: {
        start: startDate,
        end: endDate
      },
      totalSales: totalSalesCount,
      totalAmount: salesData.length > 0 ? salesData[0].totalAmount : 0,
      avgSaleValue: salesData.length > 0 ? salesData[0].avgSaleValue : 0,
      totalItems: salesData.length > 0 ? salesData[0].totalItems : 0,
      paymentMethods: paymentMethodStats,
      topProducts
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ message: 'Error fetching sales stats', error: error.message });
  }
};

// Get sales by medicine ID
export const getSalesByMedicine = async (req, res) => {
  try {
    const medicineId = req.params.medicineId;
    
    const sales = await Sale.find({
      'items.medicine': medicineId
    }).sort({ createdAt: -1 });
    
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales by medicine:', error);
    res.status(500).json({ message: 'Error fetching sales', error: error.message });
  }
};

// Delete a sale (mostly for testing/admin purposes)
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sale', error: error.message });
  }
};

// Update a sale
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, note } = req.body;
    
    // Find the sale to update
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Only allow updating certain fields to prevent misuse
    // We don't allow changing items or amounts to maintain data integrity
    const updatedFields = {};
    
    if (paymentMethod && ['Cash', 'Card', 'UPI', 'Other'].includes(paymentMethod)) {
      updatedFields.paymentMethod = paymentMethod;
    }
    
    if (note !== undefined) {
      updatedFields.note = note;
    }
    
    // Update the sale
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );
    
    res.json(updatedSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Error updating sale', error: error.message });
  }
}; 