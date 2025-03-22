import mongoose from 'mongoose';
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

/**
 * Load alert configuration
 */
export const getAlertConfig = async (req, res) => {
  try {
    // Check if config file exists
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      // Create default config if it doesn't exist
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return res.status(200).json(DEFAULT_CONFIG);
    }
    
    // Read config file
    const configFile = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(configFile);
    
    res.status(200).json(config);
  } catch (error) {
    console.error('Error loading alert configuration:', error);
    res.status(500).json({ 
      message: 'Error loading alert configuration', 
      error: error.message,
      defaultConfig: DEFAULT_CONFIG 
    });
  }
};

/**
 * Save alert configuration
 */
export const saveAlertConfig = async (req, res) => {
  try {
    const config = req.body;
    
    // Validate config data
    if (!config || !config.expiryThresholds || !config.stockThresholds || !config.checkIntervals) {
      return res.status(400).json({ message: 'Invalid configuration data' });
    }
    
    // Ensure directory exists
    const configDir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write config to file
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    
    res.status(200).json({ 
      message: 'Configuration saved successfully',
      config
    });
  } catch (error) {
    console.error('Error saving alert configuration:', error);
    res.status(500).json({ message: 'Error saving alert configuration', error: error.message });
  }
}; 