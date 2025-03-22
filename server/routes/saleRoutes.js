import express from 'express';
import {
  createSale,
  getAllSales,
  getSaleById,
  getSalesStats,
  getSalesByMedicine,
  deleteSale,
  updateSale
} from '../controllers/saleController.js';

const router = express.Router();

// Sales data routes
router.post('/', createSale);
router.get('/', getAllSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSaleById);
router.get('/medicine/:medicineId', getSalesByMedicine);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router; 