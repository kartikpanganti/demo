import express from 'express';
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
router.get('/:id', getMedicineById);
router.post('/', createMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

// Form data routes
router.get('/categories', getMedicineCategories);
router.get('/dosage-forms', getDosageForms);

// Add route for expiry tracking
router.get('/expiry-tracking', getExpiryTracking);

export default router; 