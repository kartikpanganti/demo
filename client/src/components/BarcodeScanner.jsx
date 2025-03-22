import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const BarcodeScanner = ({ onClose, onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicineDetails, setMedicineDetails] = useState(null);
  const scannerRef = useRef(null);
  
  useEffect(() => {
    let scanner = null;
    
    const initializeScanner = async () => {
      try {
        // Create scanner instance with verbose mode off
        scanner = new Html5QrcodeScanner('scanner', {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          verbose: false,
        });

        scannerRef.current = scanner;

        // Success callback
        const onScanSuccess = async (decodedText, decodedResult) => {
          try {
            setLoading(true);
            setError(null);
            setScanResult(decodedText);
            
            // Try to parse as JSON (QR code) first
            try {
              const jsonData = JSON.parse(decodedText);
              await handleQRCodeData(jsonData);
            } catch {
              // If not JSON, treat as barcode
              await handleBarcodeData(decodedText);
            }
          } catch (err) {
            console.error('Error processing scan:', err);
            setError(err.message || 'Failed to process scan');
          } finally {
            setLoading(false);
          }
        };

        // Error callback - suppress all scanning errors
        const onScanError = (err) => {
          // Do nothing - suppress all scanning errors
          return;
        };

        // Start scanner
        await scanner.render(onScanSuccess, onScanError);
        setScanning(true);
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        setError('Failed to initialize camera. Please try again.');
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      if (scanner) {
        scanner.clear()
          .then(() => {
            scanner = null;
            scannerRef.current = null;
          })
          .catch(() => {
            // Suppress cleanup errors
            scanner = null;
            scannerRef.current = null;
          });
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle QR code data
  const handleQRCodeData = async (data) => {
    try {
      if (!data.id) {
        throw new Error('Invalid QR code format');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/medicines/${data.id}`);
      const medicine = response.data;
      
      setMedicineDetails(medicine);
      
      // Verify if the scanned medicine matches the database
      if (medicine.batchNumber !== data.batch) {
        throw new Error('Batch number mismatch. Please verify the medicine.');
      }
      
      // Check expiry
      const expiryDate = new Date(medicine.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        setError('WARNING: This medicine has expired!');
      } else if (daysUntilExpiry <= 30) {
        setError(`Warning: Medicine expires in ${daysUntilExpiry} days`);
      }
      
      if (onScanComplete) {
        onScanComplete(medicine);
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  // Handle barcode data
  const handleBarcodeData = async (barcode) => {
    try {
      if (!barcode) {
        throw new Error('Invalid barcode');
      }

      const response = await axios.get(`${API_BASE_URL}/api/medicines/barcode/${barcode}`);
      const medicine = response.data;
      
      setMedicineDetails(medicine);
      
      if (onScanComplete) {
        onScanComplete(medicine);
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Medicine not found');
    }
  };

  const handleClose = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      onClose();
    } catch (err) {
      // Suppress cleanup errors
      scannerRef.current = null;
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <CameraIcon className="h-6 w-6 mr-2" />
            Scan Barcode/QR Code
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Scanner */}
          <div id="scanner" className="mb-4"></div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              <p className="mt-2 text-gray-600">Processing scan...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Scan Result */}
          {medicineDetails && !loading && (
            <div className="bg-green-50 border rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">
                    {medicineDetails.name}
                  </h3>
                  <dl className="mt-2 text-sm text-green-700">
                    <div className="flex gap-2">
                      <dt className="font-medium">Batch:</dt>
                      <dd>{medicineDetails.batchNumber}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-medium">Stock:</dt>
                      <dd>{medicineDetails.stock} units</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-medium">Expiry:</dt>
                      <dd>{new Date(medicineDetails.expiryDate).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {medicineDetails && (
              <button
                onClick={() => {
                  if (onScanComplete) onScanComplete(medicineDetails);
                  handleClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 