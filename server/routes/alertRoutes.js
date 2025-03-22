import express from 'express';
import {
  getAlerts,
  getAlertStats,
  markAsRead,
  resolveAlert,
  checkAndGenerateAlerts,
  createManualAlert,
  createExpiryAlertFromTracker,
  generateExpiryAlerts,
  createAlert
} from '../controllers/alertController.js';

const router = express.Router();

// Get all alerts with filtering
router.get('/', getAlerts);

// Get alert statistics
router.get('/stats', getAlertStats);

// Mark alert as read
router.put('/:id/read', markAsRead);

// Resolve alert
router.put('/:id/resolve', resolveAlert);

// Create a test info alert
router.post('/test-info', async (req, res) => {
  try {
    // Get a random medicine for the test alert
    const Medicine = await import('../models/Medicine.js').then(m => m.default);
    const medicine = await Medicine.findOne();
    
    if (!medicine) {
      return res.status(404).json({ message: 'No medicines found to create test alert' });
    }
    
    const Alert = await import('../models/Alert.js').then(m => m.default);
    const alert = new Alert({
      title: 'Test Info Alert',
      message: `This is a test info alert for ${medicine.name}`,
      type: 'reorder',
      priority: 'info',
      medicineId: medicine._id,
      details: {
        currentStock: medicine.stock,
        testData: 'This is a test alert created manually'
      }
    });
    
    await alert.save();
    res.status(201).json({ message: 'Test info alert created successfully', alert });
  } catch (error) {
    console.error('Error creating test info alert:', error);
    res.status(500).json({ message: 'Error creating test info alert' });
  }
});

// Manual check and generate alerts
router.post('/check', checkAndGenerateAlerts);

// Create expiry alert from tracker
router.post('/expiry', createExpiryAlertFromTracker);

// Generate expiry alerts in bulk
router.post('/generate-expiry', generateExpiryAlerts);

// Create new alert
router.post('/', createAlert);

export default router; 