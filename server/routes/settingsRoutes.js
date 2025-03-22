import express from 'express';
import { getAlertConfig, saveAlertConfig } from '../controllers/settingsController.js';

const router = express.Router();

// Get alert configuration
router.get('/alert-config', getAlertConfig);

// Save alert configuration
router.post('/alert-config', saveAlertConfig);

export default router; 