import express from 'express';
import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getLowStockMedicines,
  getExpiringMedicines,
  getMedicineStats,
  getStockLevels,
  getCategoryDistribution,
  getRecentActivities,
  getMedicineByBarcode,
  adjustStock,
  exportMedicines,
  getMedicineCategories,
  getDosageForms,
  getExpiryTracking,
  updateStockByBarcode,
  generateBarcode,
  getScanHistory
} from '../controllers/medicineController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', getMedicineStats);
router.get('/stock-levels', getStockLevels);
router.get('/category-distribution', getCategoryDistribution);
router.get('/recent-activities', getRecentActivities);

// Export route
router.get('/export', exportMedicines);

// Barcode routes
router.get('/barcode/:barcode', getMedicineByBarcode);
router.post('/barcode/:barcode/stock', updateStockByBarcode);
router.post('/:id/generate-barcode', generateBarcode);
router.get('/:id/scan-history', getScanHistory);

// Existing routes
router.get('/', getAllMedicines);
router.get('/search', searchMedicines);
router.get('/low-stock', getLowStockMedicines);
router.get('/expiring', getExpiringMedicines);
router.get('/expiry-tracking', getExpiryTracking);
router.get('/:id', getMedicineById);
router.post('/', createMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

// Form data routes
router.get('/categories', getMedicineCategories);
router.get('/dosage-forms', getDosageForms);

// Diagnostic route for testing expiry functionality
router.get('/expiry-test', async (req, res) => {
  try {
    console.log('Running expiry date diagnostics...');
    const today = new Date();
    
    // Test queries for different timeframes
    const diagnosticResults = {
      today: today.toISOString(),
      counts: {
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
      },
      sample: {
        expired: await Medicine.find({ expiryDate: { $lt: today } }).limit(2).lean(),
        critical: await Medicine.find({
          expiryDate: {
            $gte: today,
            $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }).limit(2).lean(),
        warning: await Medicine.find({
          expiryDate: {
            $gt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        }).limit(2).lean()
      }
    };
    
    res.status(200).json(diagnosticResults);
  } catch (error) {
    console.error('Error in expiry date diagnostics:', error);
    res.status(500).json({ 
      message: 'Error running expiry date diagnostics', 
      error: error.message
    });
  }
});

// Get all medicines with optional search and pagination
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'name', order = 'asc' } = req.query;
    
    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { batchNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const medicines = await Medicine.find(query)
      .sort(sortConfig)
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));
    
    // Get total count for pagination
    const total = await Medicine.countDocuments(query);
    
    res.json({
      medicines,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Error fetching medicines', error: error.message });
  }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    res.status(500).json({ message: 'Error fetching medicine details', error: error.message });
  }
});

// Get medicine by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ barcode: req.params.barcode });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found with this barcode' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine by barcode:', error);
    res.status(500).json({ message: 'Error fetching medicine by barcode', error: error.message });
  }
});

// Create new medicine
router.post('/', async (req, res) => {
  try {
    const newMedicine = new Medicine(req.body);
    const savedMedicine = await newMedicine.save();
    res.status(201).json(savedMedicine);
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ message: 'Error creating medicine', error: error.message });
  }
});

// Update medicine
router.put('/:id', async (req, res) => {
  try {
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Error updating medicine', error: error.message });
  }
});

// Delete medicine
router.delete('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Error deleting medicine', error: error.message });
  }
});

export default router; 