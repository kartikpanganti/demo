import { checkLowStock, checkExpiry, checkAndGenerateAlerts } from '../controllers/alertController.js';
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
      // Create default config if it doesn't exist
      const configDir = path.dirname(CONFIG_FILE_PATH);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
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

// Function to start the alert scheduler
export const startAlertScheduler = () => {
  const config = loadConfig();
  console.log('Starting real-time alert scheduler at', new Date().toLocaleString());
  console.log('Using configuration:', JSON.stringify(config, null, 2));
  
  // Check alerts immediately on startup
  runAlertChecks();
  
  // Schedule different types of checks at different intervals for optimal performance
  
  // 1. Quick frequent checks for critical items (low stock, imminent expiry)
  setInterval(() => {
    console.log('Running quick critical checks...');
    checkLowStock();
    checkImminentExpiry();
  }, config.checkIntervals.quickCheck * 60 * 1000); // Using configured interval
  
  // 2. Regular checks for all types of alerts
  setInterval(() => {
    console.log('Running regular alert checks...');
    runAlertChecks();
  }, config.checkIntervals.regularCheck * 60 * 1000); // Using configured interval
  
  // 3. Deep scan for upcoming issues (long-term planning)
  setInterval(() => {
    console.log('Running deep inventory scan...');
    checkAndGenerateAlerts();
  }, config.checkIntervals.deepScan * 60 * 1000); // Using configured interval
};

// Run all alert checks
const runAlertChecks = async () => {
  console.log(`Running comprehensive alert checks at ${new Date().toLocaleTimeString()}`);
  try {
    // Run the comprehensive check
    await checkAndGenerateAlerts();
    
    // Also run individual checks for more specific processing
    await checkLowStock();
    await checkExpiry();
  } catch (error) {
    console.error('Error in alert scheduler:', error);
  }
};

// Quick check just for imminent expiry (medicines expiring within 7 days)
const checkImminentExpiry = async () => {
  try {
    const config = loadConfig();
    const today = new Date();
    const criticalDate = new Date(today);
    criticalDate.setDate(criticalDate.getDate() + config.expiryThresholds.critical);
    
    // Only fetch critical-level expiring medicines
    const criticallyExpiringCount = await Medicine.countDocuments({
      expiryDate: {
        $lte: criticalDate,
        $gt: today
      }
    });
    
    if (criticallyExpiringCount > 0) {
      console.log(`CRITICAL ALERT: ${criticallyExpiringCount} medicines expiring within ${config.expiryThresholds.critical} days`);
      // Run the full expiry check to create alerts if needed
      await checkExpiry();
    }
  } catch (error) {
    console.error('Error checking imminent expiry:', error);
  }
}; 