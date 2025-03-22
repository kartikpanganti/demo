import { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

const AlertConfigModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({
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
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Load current configuration
      const fetchConfig = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_BASE_URL}/api/settings/alert-config`);
          if (response.data) {
            setConfig(response.data);
          }
        } catch (err) {
          console.error('Error loading alert configuration:', err);
          // If error, we'll use the default values
        } finally {
          setLoading(false);
        }
      };
      
      fetchConfig();
    }
  }, [isOpen]);
  
  const handleChange = (category, subcategory, value) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: Number(value)
      }
    }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/api/settings/alert-config`, config);
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onSave) onSave(config);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving alert configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Alert Configuration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="py-4 text-center">Loading configuration...</div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Expiry Thresholds (days)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Critical</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.expiryThresholds.critical}
                      onChange={(e) => handleChange('expiryThresholds', 'critical', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Warning</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.expiryThresholds.warning}
                      onChange={(e) => handleChange('expiryThresholds', 'warning', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Upcoming</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.expiryThresholds.upcoming}
                      onChange={(e) => handleChange('expiryThresholds', 'upcoming', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Stock Thresholds (units)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Critical</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={config.stockThresholds.critical}
                      onChange={(e) => handleChange('stockThresholds', 'critical', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Warning</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={config.stockThresholds.warning}
                      onChange={(e) => handleChange('stockThresholds', 'warning', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Check Intervals (minutes)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Quick Check</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.checkIntervals.quickCheck}
                      onChange={(e) => handleChange('checkIntervals', 'quickCheck', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Regular Check</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.checkIntervals.regularCheck}
                      onChange={(e) => handleChange('checkIntervals', 'regularCheck', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Deep Scan</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      value={config.checkIntervals.deepScan}
                      onChange={(e) => handleChange('checkIntervals', 'deepScan', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                Configuration saved successfully!
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertConfigModal; 