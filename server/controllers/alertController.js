import Alert from '../models/Alert.js';
import Medicine from '../models/Medicine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.join(__dirname, '../config/alertSettings.json');

// Default configuration
const DEFAULT_CONFIG = {
  expiryThresholds: {
    critical: 7,
    warning: 30,
    upcoming: 90,
  },
  stockThresholds: {
    critical: 3,
    warning: 5
  },
  checkIntervals: {
    quickCheck: 5,
    regularCheck: 30,
    deepScan: 240
  }
};

// Function to load configuration
const loadConfig = () => {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      return DEFAULT_CONFIG;
    }
    
    // Read config file
    const configFile = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.error('Error loading alert configuration:', error);
    return DEFAULT_CONFIG;
  }
};

// Configurable alert thresholds - can be moved to environment variables or database settings
const ALERT_CONFIG = {
  // Expiry thresholds in days
  expiry: {
    critical: 7,      // Critical alert when expiring in 7 days or less
    warning: 30,      // Warning alert when expiring in 30 days or less
    notice: 90        // Notice alert when expiring in 90 days or less (for long-term planning)
  },
  // Stock thresholds as percentage of minimum stock
  stock: {
    critical: 0,      // Critical when stock is 0% of minimum (out of stock)
    warning: 100,     // Warning when stock is at or below 100% of minimum (at minimum stock)
    notice: 150       // Notice when stock is at or below 150% of minimum (getting close to minimum)
  },
  // Reorder thresholds
  reorder: {
    auto: true,       // Whether to automatically suggest reordering
    bufferPercent: 20 // Buffer percentage to add to reorder amount
  }
};

// Check and generate alerts for all medicines
export const checkAndGenerateAlerts = async (req, res) => {
  try {
    const config = loadConfig();
    console.log('Running comprehensive alert check...');
    const medicines = await Medicine.find({});
    const alerts = [];
    const now = new Date();
    
    console.log(`Processing ${medicines.length} medicines for alerts`);

    for (const medicine of medicines) {
      // ===== STOCK ALERTS =====
      if (medicine.stock <= medicine.minimumStock) {
        // Determine priority based on how low the stock is
        let stockPriority = 'warning';
        let stockMessage = `Low stock alert for ${medicine.name}. Current stock: ${medicine.stock} ${medicine.unit}, Minimum required: ${medicine.minimumStock} ${medicine.unit}`;
        
        if (medicine.stock === 0) {
          stockPriority = 'critical';
          stockMessage = `OUT OF STOCK: ${medicine.name} is completely out of stock. Urgent restock required.`;
        } else if (medicine.stock < medicine.minimumStock * 0.5) {
          stockPriority = 'critical';
          stockMessage = `CRITICAL LOW STOCK: ${medicine.name} is critically low. Current stock: ${medicine.stock} ${medicine.unit}, Minimum required: ${medicine.minimumStock} ${medicine.unit}`;
        }
        
        alerts.push({
          title: medicine.stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: stockMessage,
          type: 'low_stock',
          priority: stockPriority,
          medicineId: medicine._id,
          details: {
            currentStock: medicine.stock,
            minimumStock: medicine.minimumStock,
            reorderLevel: medicine.reorderLevel,
            suggestedOrder: calculateReorderAmount(medicine),
            daysUntilStockout: estimateDaysUntilStockout(medicine)
          }
        });
      }

      // ===== REORDER ALERTS =====
      if (medicine.reorderLevel && medicine.stock <= medicine.reorderLevel && medicine.stock > 0) {
        alerts.push({
          title: 'Reorder Recommended',
          message: `Reorder alert for ${medicine.name}. Current stock: ${medicine.stock} ${medicine.unit}, Reorder level: ${medicine.reorderLevel} ${medicine.unit}`,
          type: 'reorder',
          priority: 'warning',
          medicineId: medicine._id,
          details: {
            currentStock: medicine.stock,
            minimumStock: medicine.minimumStock,
            reorderLevel: medicine.reorderLevel,
            suggestedOrder: calculateReorderAmount(medicine),
            supplier: medicine.supplier,
            lastOrderDate: medicine.lastUpdated || medicine.createdAt
          }
        });
      }

      // ===== EXPIRY ALERTS =====
      if (medicine.expiryDate) {
        const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - now) / (1000 * 60 * 60 * 24));
        
        // Already expired
        if (daysUntilExpiry <= 0) {
          alerts.push({
            title: 'Medicine Expired',
            message: `${medicine.name} expired ${Math.abs(daysUntilExpiry)} days ago on ${new Date(medicine.expiryDate).toLocaleDateString()}. Remove from inventory immediately.`,
            type: 'expired',
            priority: 'critical',
            medicineId: medicine._id,
            details: {
              expiryDate: medicine.expiryDate,
              daysExpired: Math.abs(daysUntilExpiry),
              currentStock: medicine.stock,
              batchNumber: medicine.batchNumber
            }
          });
        } 
        // Critical expiry window
        else if (daysUntilExpiry <= config.expiryThresholds.critical) {
          alerts.push({
            title: 'Critical Expiry Alert',
            message: `${medicine.name} will expire in just ${daysUntilExpiry} day(s) on ${new Date(medicine.expiryDate).toLocaleDateString()}. Urgent attention required.`,
            type: 'expiring',
            priority: 'critical',
            medicineId: medicine._id,
            details: {
              expiryDate: medicine.expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              currentStock: medicine.stock,
              batchNumber: medicine.batchNumber
            }
          });
        }
        // Warning expiry window
        else if (daysUntilExpiry <= config.expiryThresholds.warning) {
          alerts.push({
            title: 'Expiring Soon',
            message: `${medicine.name} will expire in ${daysUntilExpiry} days on ${new Date(medicine.expiryDate).toLocaleDateString()}.`,
            type: 'expiring',
            priority: 'warning',
            medicineId: medicine._id,
            details: {
              expiryDate: medicine.expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              currentStock: medicine.stock
            }
          });
        }
        // Notice expiry window - for planning purposes
        else if (daysUntilExpiry <= config.expiryThresholds.upcoming) {
          alerts.push({
            title: 'Expiry Notice',
            message: `${medicine.name} will expire in ${daysUntilExpiry} days on ${new Date(medicine.expiryDate).toLocaleDateString()}.`,
            type: 'expiring',
            priority: 'info',
            medicineId: medicine._id,
            details: {
              expiryDate: medicine.expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              currentStock: medicine.stock
            }
          });
        }
      }
    }

    // Create new alerts only if they don't already exist
    console.log(`Generated ${alerts.length} potential alerts, checking for duplicates...`);
    let newAlertsCount = 0;
    
    for (const alert of alerts) {
      const existingAlert = await Alert.findOne({
        medicineId: alert.medicineId,
        type: alert.type,
        status: { $ne: 'resolved' }
      });

      if (!existingAlert) {
        await Alert.create(alert);
        newAlertsCount++;
        console.log(`Created new alert: ${alert.type} - ${alert.title}`);
      }
    }
    
    console.log(`Created ${newAlertsCount} new alerts`);

    if (req && res) {
      res.status(200).json({ 
        message: 'Alerts checked and generated successfully',
        generated: newAlertsCount,
        total: alerts.length
      });
    }
  } catch (error) {
    console.error('Error generating alerts:', error);
    if (req && res) {
      res.status(500).json({ message: 'Error generating alerts', error: error.message });
    }
  }
};

// Helper function to calculate suggested reorder amount
function calculateReorderAmount(medicine) {
  const buffer = ALERT_CONFIG.reorder.bufferPercent / 100;
  const targetStock = medicine.minimumStock * 2;
  const reorderAmount = Math.max(0, targetStock - medicine.stock);
  // Add buffer and round up to nearest whole number
  return Math.ceil(reorderAmount * (1 + buffer));
}

// Helper function to estimate days until stock out based on historical data
// This is a placeholder - real implementation would use historical usage data
function estimateDaysUntilStockout(medicine) {
  // Assume average usage of 10% of minimum stock per day
  // This could be replaced with actual usage analytics
  const avgDailyUsage = medicine.minimumStock * 0.1;
  if (avgDailyUsage <= 0) return null;
  return Math.floor(medicine.stock / avgDailyUsage);
}

// Get all alerts with filtering
export const getAlerts = async (req, res) => {
  try {
    console.log('Getting alerts with filters:', req.query);
    const query = {};
    
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    
    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority;
    }
    
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    console.log('Final query:', query);

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'medicineId',
        select: 'name stock unit minimumStock reorderLevel expiryDate'
      });

    console.log(`Found ${alerts.length} alerts`);
    
    // Format the response to ensure consistent structure
    const formattedAlerts = alerts.map(alert => {
      const formattedAlert = alert.toObject();
      
      // Ensure alert has an _id field
      if (!formattedAlert._id && formattedAlert.id) {
        formattedAlert._id = formattedAlert.id;
      }
      
      return formattedAlert;
    });

    res.status(200).json(formattedAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

// Get alert statistics
export const getAlertStats = async (req, res) => {
  try {
    const stats = {
      total: await Alert.countDocuments(),
      unread: await Alert.countDocuments({ read: false }),
      critical: await Alert.countDocuments({ priority: 'critical' }),
      warning: await Alert.countDocuments({ priority: 'warning' }),
      info: await Alert.countDocuments({ priority: 'info' }),
      
      // Additional statistics by type
      byType: {
        lowStock: await Alert.countDocuments({ type: 'low_stock' }),
        expiring: await Alert.countDocuments({ type: 'expiring' }),
        expired: await Alert.countDocuments({ type: 'expired' }),
        reorder: await Alert.countDocuments({ type: 'reorder' })
      },
      
      // Additional statistics by status
      byStatus: {
        new: await Alert.countDocuments({ status: 'new' }),
        pending: await Alert.countDocuments({ status: 'pending' }),
        resolved: await Alert.countDocuments({ status: 'resolved' })
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Error fetching alert statistics', error: error.message });
  }
};

// Mark alert as read
export const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.read = true;
    await alert.save();
    
    res.status(200).json({ message: 'Alert marked as read', id: alert._id });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Error marking alert as read', error: error.message });
  }
};

// Resolve alert
export const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'resolved';
    await alert.save();
    
    res.status(200).json({ message: 'Alert resolved', id: alert._id });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert', error: error.message });
  }
};

// Create a test info alert
export const createTestInfoAlert = async (req, res) => {
  try {
    const medicines = await Medicine.find().limit(1);
    if (medicines.length === 0) {
      return res.status(404).json({ message: 'No medicines found for test alert' });
    }

    const medicine = medicines[0];
    
    const alert = new Alert({
      title: 'Test Info Alert',
      message: `This is a test info alert for ${medicine.name}`,
      type: 'reorder',
      priority: 'info',
      medicineId: medicine._id,
      details: {
        testData: 'This is a test alert created manually'
      }
    });
    
    await alert.save();
    
    res.status(201).json({ message: 'Test alert created successfully', alert });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({ message: 'Error creating test alert', error: error.message });
  }
};

// Check and create alerts for low stock with enhanced detail
export const checkLowStock = async () => {
  try {
    console.log('Running low stock alert check...');
    const medicines = await Medicine.find({
      $expr: { $lte: ['$stock', '$minimumStock'] }
    });
    
    console.log(`Found ${medicines.length} medicines with low stock`);

    for (const medicine of medicines) {
      // Skip medicines already with low stock alerts
      const existingAlert = await Alert.findOne({
        medicineId: medicine._id,
        type: 'low_stock',
        status: { $ne: 'resolved' }
      });

      if (!existingAlert) {
        // Determine priority
        let priority = 'warning';
        let title = 'Low Stock Alert';
        let message = `${medicine.name} is running low on stock. Current stock: ${medicine.stock} ${medicine.unit}`;
        
        if (medicine.stock === 0) {
          priority = 'critical';
          title = 'Out of Stock';
          message = `${medicine.name} is out of stock. Immediate restock required.`;
        } else if (medicine.stock < medicine.minimumStock * 0.5) {
          priority = 'critical';
          title = 'Critical Low Stock';
          message = `${medicine.name} has critically low stock. Current stock: ${medicine.stock} ${medicine.unit}`;
        }

        const alert = new Alert({
          title,
          message,
          type: 'low_stock',
          priority,
          medicineId: medicine._id,
          details: {
            currentStock: medicine.stock,
            minimumStock: medicine.minimumStock,
            reorderLevel: medicine.reorderLevel,
            suggestedOrder: calculateReorderAmount(medicine)
          }
        });

        await alert.save();
        console.log(`Created new low stock alert for ${medicine.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

// Check and create alerts for expiring medicines with enhanced expiry windows
export const checkExpiry = async () => {
  try {
    console.log('Running expiry alert check...');
    const now = new Date();
    const criticalDate = new Date(now);
    criticalDate.setDate(criticalDate.getDate() + ALERT_CONFIG.expiry.critical);
    
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + ALERT_CONFIG.expiry.warning);
    
    const noticeDate = new Date(now);
    noticeDate.setDate(noticeDate.getDate() + ALERT_CONFIG.expiry.notice);
    
    // Find medicines expiring within notice period
    const expiringMedicines = await Medicine.find({
      expiryDate: {
        $lte: noticeDate,
        $gt: now
      }
    });
    
    console.log(`Found ${expiringMedicines.length} medicines expiring soon`);
    
    for (const medicine of expiringMedicines) {
      const existingAlert = await Alert.findOne({
        medicineId: medicine._id,
        type: 'expiring',
        status: { $ne: 'resolved' }
      });

      if (!existingAlert) {
        const daysUntilExpiry = Math.ceil((medicine.expiryDate - now) / (1000 * 60 * 60 * 24));
        
        let priority, title;
        if (daysUntilExpiry <= ALERT_CONFIG.expiry.critical) {
          priority = 'critical';
          title = 'Critical Expiry Alert';
        } else if (daysUntilExpiry <= ALERT_CONFIG.expiry.warning) {
          priority = 'warning';
          title = 'Expiring Soon';
        } else {
          priority = 'info';
          title = 'Expiry Notice';
        }
        
        const alert = new Alert({
          title,
          message: `${medicine.name} will expire in ${daysUntilExpiry} days on ${new Date(medicine.expiryDate).toLocaleDateString()}`,
          type: 'expiring',
          priority,
          medicineId: medicine._id,
          details: {
            currentStock: medicine.stock,
            expiryDate: medicine.expiryDate,
            daysUntilExpiry
          }
        });

        await alert.save();
        console.log(`Created expiry alert for ${medicine.name} (expires in ${daysUntilExpiry} days)`);
      }
    }

    // Check for expired medicines
    const expiredMedicines = await Medicine.find({
      expiryDate: { $lte: now }
    });

    console.log(`Found ${expiredMedicines.length} expired medicines`);

    for (const medicine of expiredMedicines) {
      const existingAlert = await Alert.findOne({
        medicineId: medicine._id,
        type: 'expired',
        status: { $ne: 'resolved' }
      });

      if (!existingAlert) {
        const daysExpired = Math.abs(Math.ceil((medicine.expiryDate - now) / (1000 * 60 * 60 * 24)));
        
        const alert = new Alert({
          title: 'Medicine Expired',
          message: `${medicine.name} expired ${daysExpired} days ago on ${new Date(medicine.expiryDate).toLocaleDateString()}`,
          type: 'expired',
          priority: 'critical',
          medicineId: medicine._id,
          details: {
            currentStock: medicine.stock,
            expiryDate: medicine.expiryDate,
            daysExpired
          }
        });

        await alert.save();
        console.log(`Created expired alert for ${medicine.name} (expired ${daysExpired} days ago)`);
      }
    }
  } catch (error) {
    console.error('Error checking expiry:', error);
  }
};

// Create info alerts for stock updates
export const createStockUpdateAlert = async (medicineId, oldStock, newStock) => {
  try {
    // Get medicine details
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return;
    
    // Only create alert if there's a significant change (more than 10% increase)
    if (newStock > oldStock && (newStock - oldStock) / oldStock > 0.1) {
      const alert = new Alert({
        title: 'Stock Replenished',
        message: `${medicine.name} stock has been increased from ${oldStock} to ${newStock} ${medicine.unit || 'units'}`,
        type: 'reorder',
        priority: 'info',
        medicineId: medicine._id,
        details: {
          currentStock: newStock,
          previousStock: oldStock,
          difference: newStock - oldStock,
          percentChange: oldStock > 0 ? Math.round(((newStock - oldStock) / oldStock) * 100) : 100
        }
      });
      
      await alert.save();
      console.log(`Created stock update alert for ${medicine.name}`);
    }
  } catch (error) {
    console.error('Error creating stock update alert:', error);
  }
};

// Create info alert for new medicine added
export const createNewMedicineAlert = async (medicineId) => {
  try {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return;
    
    const alert = new Alert({
      title: 'New Medicine Added',
      message: `New medicine "${medicine.name}" has been added to inventory with initial stock of ${medicine.stock} ${medicine.unit || 'units'}`,
      type: 'reorder',
      priority: 'info',
      medicineId: medicine._id,
      details: {
        currentStock: medicine.stock,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        expiryDate: medicine.expiryDate
      }
    });
    
    await alert.save();
    console.log(`Created new medicine alert for ${medicine.name}`);
  } catch (error) {
    console.error('Error creating new medicine alert:', error);
  }
};

/**
 * Creates an expiry alert for a specific medicine from the expiry tracker
 */
export const createExpiryAlertFromTracker = async (req, res) => {
  try {
    const { medicineId, days, medicineInfo } = req.body;
    
    if (!medicineId) {
      return res.status(400).json({ message: 'Medicine ID is required' });
    }
    
    // Look for existing alerts for this medicine
    const existingAlert = await Alert.findOne({
      medicineId,
      type: 'expiring',
      status: { $in: ['new', 'in-progress'] }
    });
    
    if (existingAlert) {
      return res.status(200).json({ 
        message: 'Alert already exists for this medicine', 
        alert: existingAlert 
      });
    }
    
    let priority = 'info';
    if (days <= 0) {
      priority = 'critical';
    } else if (days <= 7) {
      priority = 'critical';
    } else if (days <= 30) {
      priority = 'warning';
    }
    
    const expiryDate = medicineInfo?.expiryDate ? new Date(medicineInfo.expiryDate).toLocaleDateString() : 'Unknown';
    
    const alert = new Alert({
      title: `Medication Expiry Alert: ${medicineInfo?.name || 'Unknown Medicine'}`,
      message: days <= 0 
        ? `Medicine has EXPIRED. Take immediate action.` 
        : `Medicine will expire in ${days} days (${expiryDate}).`,
      type: 'expiring',
      priority,
      medicineId,
      details: {
        expiryDate: medicineInfo?.expiryDate || null,
        daysUntilExpiry: days,
        batchNumber: medicineInfo?.batchNumber || 'Unknown',
        stock: medicineInfo?.stock || 0,
        name: medicineInfo?.name || 'Unknown'
      }
    });
    
    await alert.save();
    
    res.status(201).json({
      message: 'Expiry alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating expiry alert:', error);
    res.status(500).json({ message: 'Error creating expiry alert', error: error.message });
  }
};

/**
 * Generate expiry alerts for selected medicines
 */
export const generateExpiryAlerts = async (req, res) => {
  try {
    const { medicineIds } = req.body;
    const today = new Date();
    let query = {};
    
    // If specific medicine IDs are provided, filter by them
    if (medicineIds && medicineIds.length > 0) {
      query._id = { $in: medicineIds };
    } else {
      // Otherwise, only consider medicines that are expiring within 90 days or already expired
      const ninetyDaysFromNow = new Date(today);
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      
      query.expiryDate = { $lte: ninetyDaysFromNow };
    }
    
    const medicines = await Medicine.find(query);
    console.log(`Generating expiry alerts for ${medicines.length} medicines`);
    
    let created = 0;
    let skipped = 0;
    
    for (const medicine of medicines) {
      const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - today) / (1000 * 60 * 60 * 24));
      
      // Skip medicines that don't need alerts (more than 90 days until expiry)
      if (daysUntilExpiry > 90) {
        skipped++;
        continue;
      }
      
      // Check for existing alert
      const existingAlert = await Alert.findOne({
        medicineId: medicine._id,
        type: daysUntilExpiry <= 0 ? 'expired' : 'expiring',
        status: { $ne: 'resolved' }
      });
      
      if (existingAlert) {
        skipped++;
        continue;
      }
      
      // Determine priority based on days until expiry
      let priority = 'info';
      let type = 'expiring';
      let title = 'Expiry Notice';
      
      if (daysUntilExpiry <= 0) {
        priority = 'critical';
        type = 'expired';
        title = 'Medicine Expired';
      } else if (daysUntilExpiry <= 7) {
        priority = 'critical';
        title = 'Critical Expiry Alert';
      } else if (daysUntilExpiry <= 30) {
        priority = 'warning';
        title = 'Expiring Soon';
      }
      
      // Create the alert
      const alert = new Alert({
        title,
        message: daysUntilExpiry <= 0
          ? `${medicine.name} has EXPIRED ${Math.abs(daysUntilExpiry)} days ago on ${new Date(medicine.expiryDate).toLocaleDateString()}.`
          : `${medicine.name} will expire in ${daysUntilExpiry} days on ${new Date(medicine.expiryDate).toLocaleDateString()}.`,
        type,
        priority,
        medicineId: medicine._id,
        details: {
          expiryDate: medicine.expiryDate,
          daysUntilExpiry: daysUntilExpiry,
          batchNumber: medicine.batchNumber,
          stock: medicine.stock,
          name: medicine.name
        }
      });
      
      await alert.save();
      created++;
    }
    
    res.status(200).json({
      message: `Generated ${created} expiry alerts (${skipped} skipped due to existing alerts or not needed)`,
      created,
      skipped
    });
  } catch (error) {
    console.error('Error generating expiry alerts:', error);
    res.status(500).json({ message: 'Error generating expiry alerts', error: error.message });
  }
};

/**
 * Create a new alert manually
 */
export const createAlert = async (req, res) => {
  try {
    const { title, message, type, priority, medicineId, details } = req.body;
    
    if (!title || !message || !type || !priority) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const alert = new Alert({
      title,
      message,
      type,
      priority,
      medicineId,
      details
    });
    
    await alert.save();
    
    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
};

/**
 * Create a manual alert for testing purposes
 */
export const createManualAlert = async (req, res) => {
  try {
    const { message, type = 'info', priority = 'info', medicineId } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Alert message is required' });
    }
    
    const alert = new Alert({
      title: 'Manual Test Alert',
      message,
      type,
      priority,
      medicineId,
      details: {
        createdManually: true,
        timestamp: new Date()
      }
    });
    
    await alert.save();
    
    res.status(201).json({
      message: 'Manual alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating manual alert:', error);
    res.status(500).json({ message: 'Error creating manual alert', error: error.message });
  }
}; 