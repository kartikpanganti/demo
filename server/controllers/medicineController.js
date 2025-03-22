import Medicine from '../models/Medicine.js';
import { createNewMedicineAlert, createStockUpdateAlert, checkLowStock } from './alertController.js';

// Get all medicines with filtering, sorting, and pagination
export const getAllMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const query = {};
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { manufacturer: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.stock === 'low') {
      query.stock = { $lte: '$minimumStock' };
    } else if (req.query.stock === 'out') {
      query.stock = 0;
    }

    const today = new Date();
    if (req.query.expiry === 'expiring') {
      const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
      query.expiryDate = {
        $gt: today,
        $lte: thirtyDaysFromNow
      };
    } else if (req.query.expiry === 'expired') {
      query.expiryDate = { $lt: today };
    }

    // Build sort query
    const sortField = req.query.sortField || 'name';
    const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortDirection };

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Medicine.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      medicines,
      currentPage: page,
      totalPages,
      totalMedicines: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get medicine by barcode
export const getMedicineByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const medicine = await Medicine.findOne({ barcode });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Record the scan
    await medicine.recordScan('check');
    
    res.status(200).json(medicine);
  } catch (error) {
    console.error('Error fetching medicine by barcode:', error);
    res.status(500).json({ message: 'Error fetching medicine', error: error.message });
  }
};

// Update stock via barcode scan
export const updateStockByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { action, quantity, notes, scannedBy } = req.body;
    
    const medicine = await Medicine.findOne({ barcode });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Record the scan and update stock
    await medicine.recordScan(action, quantity, notes, scannedBy);
    
    // Generate alerts if needed
    if (medicine.stock <= medicine.minimumStock) {
      await checkLowStock();
    }
    
    res.status(200).json({
      message: 'Stock updated successfully',
      medicine
    });
  } catch (error) {
    console.error('Error updating stock by barcode:', error);
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};

// Generate new barcode
export const generateBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    const { barcodeType = 'CODE128' } = req.body;
    
    const medicine = await Medicine.findById(id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Generate unique barcode if not exists
    if (!medicine.barcode) {
      const timestamp = Date.now().toString().slice(-4);
      medicine.barcode = `MED${medicine._id.slice(-4)}${medicine.batchNumber || 'NOBATCH'}${timestamp}`;
      medicine.barcodeType = barcodeType;
      medicine.barcodeGenerated = new Date();
      
      await medicine.save();
    }
    
    res.status(200).json({
      message: 'Barcode generated successfully',
      medicine
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  }
};

// Get scan history
export const getScanHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findById(id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.status(200).json({
      scanHistory: medicine.scanHistory,
      lastScanned: medicine.lastScanned
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ message: 'Error fetching scan history', error: error.message });
  }
};

// Adjust stock
export const adjustStock = async (req, res) => {
  try {
    const { adjustment } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const oldStock = medicine.stock;
    const newStock = medicine.stock + adjustment;
    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    medicine.stock = newStock;
    await medicine.save();
    
    // Create info alert for stock increase
    if (adjustment > 0) {
      await createStockUpdateAlert(medicine._id, oldStock, newStock);
    }

    res.json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new medicine
export const createMedicine = async (req, res) => {
  try {
    // Generate barcode if not provided
    if (!req.body.barcode) {
      const prefix = '299'; // Custom prefix for your pharmacy
      const timestamp = Date.now().toString().slice(-5);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const barcode = prefix + timestamp + random;
      
      // Add check digit using modulo 10
      let sum = 0;
      for (let i = 0; i < barcode.length; i++) {
        sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      
      req.body.barcode = barcode + checkDigit;
    }

    const medicine = new Medicine(req.body);
    const newMedicine = await medicine.save();
    
    // Create info alert for new medicine
    await createNewMedicineAlert(newMedicine._id);
    
    res.status(201).json(newMedicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a medicine
export const updateMedicine = async (req, res) => {
  try {
    // Check if updating barcode and if it already exists
    if (req.body.barcode) {
      const existingMedicine = await Medicine.findOne({
        barcode: req.body.barcode,
        _id: { $ne: req.params.id }
      });
      if (existingMedicine) {
        return res.status(400).json({ message: 'Medicine with this barcode already exists' });
      }
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a medicine
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock medicines
export const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$stock', '$minimumStock'] }
    }).sort({ stock: 1 });
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expiring medicines (within 3 months)
export const getExpiringMedicines = async (req, res) => {
  try {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const medicines = await Medicine.find({
      expiryDate: {
        $gte: new Date(),
        $lte: threeMonthsFromNow
      }
    }).sort({ expiryDate: 1 });
    
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search medicines by name, barcode, or category
export const searchMedicines = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { manufacturer: { $regex: query, $options: 'i' } }
      ]
    }).sort({ name: 1 });

    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get medicine statistics
export const getMedicineStats = async (req, res) => {
  try {
    const [
      totalMedicines,
      lowStockCount,
      expiringCount,
      totalValue
    ] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.countDocuments({
        $expr: { $lte: ['$stock', '$minimumStock'] }
      }),
      Medicine.countDocuments({
        expiryDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }),
      Medicine.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ])
    ]);

    res.json({
      totalMedicines,
      lowStockCount,
      expiringCount,
      totalValue: totalValue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stock levels for dashboard chart
export const getStockLevels = async (req, res) => {
  try {
    const stockLevels = await Medicine.find()
      .select('name stock')
      .sort('-stock')
      .limit(10);
    
    res.json(stockLevels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category distribution for dashboard chart
export const getCategoryDistribution = async (req, res) => {
  try {
    const distribution = await Medicine.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const recentMedicines = await Medicine.find()
      .select('name updatedAt')
      .sort('-updatedAt')
      .limit(10);

    const activities = recentMedicines.map(medicine => ({
      timestamp: medicine.updatedAt,
      type: 'Update',
      medicineName: medicine.name,
      details: 'Medicine information updated'
    }));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this function to get enhanced statistics
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Get all medicines for calculations
    const medicines = await Medicine.find({});
    
    // Calculate total value and counts
    let totalValue = 0;
    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    const categoryDistribution = {};

    medicines.forEach(medicine => {
      // Calculate total value
      totalValue += medicine.price * medicine.stock;

      // Count low stock items
      if (medicine.stock <= medicine.minimumStock) {
        lowStockCount++;
      }

      // Count expiring and expired items
      if (medicine.expiryDate <= thirtyDaysFromNow && medicine.expiryDate > now) {
        expiringCount++;
      } else if (medicine.expiryDate <= now) {
        expiredCount++;
      }

      // Build category distribution
      if (categoryDistribution[medicine.category]) {
        categoryDistribution[medicine.category]++;
      } else {
        categoryDistribution[medicine.category] = 1;
      }
    });

    // Sort category distribution by count
    const sortedCategories = {};
    Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([key, value]) => {
        sortedCategories[key] = value;
      });

    const stats = {
      totalMedicines: medicines.length,
      totalValue,
      lowStockCount,
      expiringCount,
      expiredCount,
      categoryDistribution: sortedCategories
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Error getting statistics' });
  }
};

// Export all medicines with complete details
export const exportMedicines = async (req, res) => {
  try {
    // Build filter query
    const query = {};
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { manufacturer: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.manufacturer) {
      query.manufacturer = { $regex: req.query.manufacturer, $options: 'i' };
    }

    if (req.query.stock === 'low') {
      query.stock = { $lte: '$minimumStock' };
    } else if (req.query.stock === 'out') {
      query.stock = 0;
    }

    const today = new Date();
    if (req.query.expiry === 'expiring') {
      const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
      query.expiryDate = {
        $gt: today,
        $lte: thirtyDaysFromNow
      };
    } else if (req.query.expiry === 'expired') {
      query.expiryDate = { $lt: today };
    }

    if (req.query.priceRange) {
      const { min, max } = req.query.priceRange;
      if (min || max) {
        query.price = {};
        if (min) query.price.$gte = Number(min);
        if (max) query.price.$lte = Number(max);
      }
    }

    // Build sort query
    const sortField = req.query.sortField || 'name';
    const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortDirection };

    // Get all medicines with complete details
    const medicines = await Medicine.find(query).sort(sort);

    res.json({
      medicines,
      totalMedicines: medicines.length
    });
  } catch (error) {
    console.error('Error exporting medicines:', error);
    res.status(500).json({ message: 'Error exporting medicines' });
  }
};

// Get medicines with expiry tracking information
export const getExpiryTracking = async (req, res) => {
  try {
    const { timeframe, sortField = 'expiryDate', sortDirection = 'asc', search, category, manufacturer } = req.query;
    
    // Build the query based on timeframe and filters
    const query = {};
    const today = new Date();
    
    // Add timeframe filter
    if (timeframe) {
      switch (timeframe) {
        case 'expired':
          query.expiryDate = { $lt: today };
          break;
        case 'critical':
          const criticalDate = new Date(today);
          criticalDate.setDate(criticalDate.getDate() + 7);
          query.expiryDate = { $gte: today, $lte: criticalDate };
          break;
        case 'warning':
          const warningStartDate = new Date(today);
          warningStartDate.setDate(warningStartDate.getDate() + 8);
          const warningEndDate = new Date(today);
          warningEndDate.setDate(warningEndDate.getDate() + 30);
          query.expiryDate = { $gte: warningStartDate, $lte: warningEndDate };
          break;
        case 'upcoming':
          const upcomingStartDate = new Date(today);
          upcomingStartDate.setDate(upcomingStartDate.getDate() + 31);
          const upcomingEndDate = new Date(today);
          upcomingEndDate.setDate(upcomingEndDate.getDate() + 90);
          query.expiryDate = { $gte: upcomingStartDate, $lte: upcomingEndDate };
          break;
        case 'safe':
          const safeDate = new Date(today);
          safeDate.setDate(safeDate.getDate() + 91);
          query.expiryDate = { $gte: safeDate };
          break;
      }
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add manufacturer filter
    if (manufacturer) {
      query.manufacturer = manufacturer;
    }
    
    // Get stats for all timeframes regardless of current filter
    const stats = {
      expired: await Medicine.countDocuments({ expiryDate: { $lt: today } }),
      critical: await Medicine.countDocuments({
        expiryDate: {
          $gte: today,
          $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }),
      warning: await Medicine.countDocuments({
        expiryDate: {
          $gt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      }),
      upcoming: await Medicine.countDocuments({
        expiryDate: {
          $gt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          $lte: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
        }
      }),
      safe: await Medicine.countDocuments({
        expiryDate: { $gt: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000) }
      })
    };
    
    // Sort options
    const sort = {};
    
    // Special case for daysUntilExpiry since it's a calculated field
    if (sortField === 'daysUntilExpiry') {
      sort.expiryDate = sortDirection === 'asc' ? 1 : -1;
    } else {
      sort[sortField] = sortDirection === 'asc' ? 1 : -1;
    }
    
    // Get medicines with the applied filters
    const medicines = await Medicine.find(query).sort(sort);
    
    // Add calculated daysUntilExpiry field
    const medicinesWithDays = medicines.map(medicine => {
      const doc = medicine.toObject();
      const diffTime = new Date(medicine.expiryDate) - today;
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...doc,
        daysUntilExpiry
      };
    });
    
    res.status(200).json({
      medicines: medicinesWithDays,
      stats,
      totalCount: medicinesWithDays.length
    });
  } catch (error) {
    console.error('Error fetching expiry tracking data:', error);
    res.status(500).json({ message: 'Error fetching expiry tracking data', error: error.message });
  }
};

// Get all medicine categories
export const getMedicineCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.status(200).json(categories.filter(cat => cat && cat.trim() !== '').sort());
  } catch (error) {
    console.error('Error fetching medicine categories:', error);
    res.status(500).json({ message: 'Error fetching medicine categories', error: error.message });
  }
};

// Get all dosage forms
export const getDosageForms = async (req, res) => {
  try {
    const dosageForms = await Medicine.distinct('dosageForm');
    res.status(200).json(dosageForms.filter(form => form && form.trim() !== '').sort());
  } catch (error) {
    console.error('Error fetching dosage forms:', error);
    res.status(500).json({ message: 'Error fetching dosage forms', error: error.message });
  }
}; 