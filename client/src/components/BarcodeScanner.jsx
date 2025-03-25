import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BarcodeScanner = ({ onClose, onScanComplete, isBilling = false }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicineDetails, setMedicineDetails] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [continuousMode, setContinuousMode] = useState(isBilling);
  const [successCount, setSuccessCount] = useState(0);
  const [lastScanned, setLastScanned] = useState(null);
  const [expiredMedicine, setExpiredMedicine] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const scannerRef = useRef(null);
  const scannerContainerId = "qr-reader-container";
  
  // Initialize camera list
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          setCameraId(devices[0].id);
        } else {
          setError('No camera devices found');
        }
      } catch (err) {
        console.error('Error getting cameras', err);
        setError('Failed to access camera. Please check permissions.');
      }
    };
    
    getCameras();
    
    return () => {
      // Ensure scanner is stopped when component unmounts
      stopScanner();
    };
  }, []);
  
  // Start scanner whenever cameraId changes or scanning state changes
  useEffect(() => {
    if (cameraId && !scanning) {
      startScanner();
    }
  }, [cameraId]);
  
  // Auto-add medicine to cart when details are available in continuous mode
  useEffect(() => {
    if (continuousMode && medicineDetails && medicineDetails.stock > 0 && medicineDetails._id !== lastScanned) {
      // Check if this is an expired medicine that needs confirmation
      if (expiredMedicine && expiredMedicine._id === medicineDetails._id) {
        // Don't auto-add expired medicines - they need manual confirmation
        return;
      }
      
      // Only add to cart if this is a new scan (prevents duplicates)
      handleAddToCart();
    }
  }, [medicineDetails, continuousMode]);
  
  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await stopScanner(); // Stop any existing scanner
      }
      
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      setScanning(true);
      setError(null);
      
      const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        try {
          setLoading(true);
          setError(null);
          setScanResult(decodedText);
          
          // Pause scanning while processing
          await html5QrCode.pause();
          
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
          // Resume scanning on error if in continuous mode
          if (continuousMode) {
            html5QrCode.resume();
          }
        } finally {
          setLoading(false);
        }
      };
      
      const config = { 
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };
      
      await html5QrCode.start(
        cameraId, 
        config,
        qrCodeSuccessCallback,
        // Error callback - ignored for UI purposes
        (errorMessage) => {}
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError(`Failed to start camera: ${err.message}`);
      setScanning(false);
    }
  };
  
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        // Check if scanner is actually scanning before trying to stop
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          console.log("Scanner stopped successfully");
        }
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
      // Even if there's an error, ensure we clear the reference
      scannerRef.current = null;
    } finally {
      // Make sure we update the scanning state
      setScanning(false);
    }
  };

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
        setExpiredMedicine(medicine);
        return medicine;
      } else if (daysUntilExpiry <= 30) {
        setError(`WARNING: This medicine expires in ${daysUntilExpiry} days!`);
      }
      
      // Check stock
      if (medicine.stock <= 0) {
        setError('This medicine is out of stock!');
        // Resume scanning in continuous mode even on warning
        if (continuousMode && scannerRef.current) {
          setTimeout(() => scannerRef.current.resume(), 2000);
        }
        return;
      }
      
      return medicine;
    } catch (err) {
      console.error('Error processing QR code:', err);
      throw err;
    }
  };

  // Handle barcode data
  const handleBarcodeData = async (barcode) => {
    try {
      // Search medicine by barcode
      const response = await axios.get(`${API_BASE_URL}/api/medicines/barcode/${barcode}`);
      
      if (response.data) {
        const medicine = response.data;
        setMedicineDetails(medicine);
        
        // Check expiry
        const expiryDate = new Date(medicine.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          setError('WARNING: This medicine has expired!');
          setExpiredMedicine(medicine);
          return medicine;
        } else if (daysUntilExpiry <= 30) {
          setError(`WARNING: This medicine expires in ${daysUntilExpiry} days!`);
        }
        
        // Check stock
        if (medicine.stock <= 0) {
          setError('This medicine is out of stock!');
          // Resume scanning in continuous mode even on warning
          if (continuousMode && scannerRef.current) {
            setTimeout(() => scannerRef.current.resume(), 2000);
          }
          return;
        }
        
        return medicine;
      } else {
        setError('No medicine found with this barcode');
        // Resume scanning in continuous mode even on error
        if (continuousMode && scannerRef.current) {
          setTimeout(() => scannerRef.current.resume(), 2000);
        }
        
        throw new Error('Error fetching medicine');
      }
    } catch (err) {
      // This is our generic outer error handler
      if (!err.message.includes('Error fetching medicine')) {
        setError(err.message || 'Failed to process barcode');
      }
      
      // Resume scanning in continuous mode after error
      if (continuousMode && scannerRef.current) {
        setTimeout(() => scannerRef.current.resume(), 2000);
      }
      
      throw err;
    }
  };

  const handleClose = async () => {
    try {
      // Prevent multiple clicks
      if (isClosing) return;
      
      setIsClosing(true);
      await stopScanner();
      onClose();
    } catch (err) {
      console.error('Error during close:', err);
      onClose();
    }
  };

  // Function to handle adding to cart
  const handleAddToCart = (forceAdd = false) => {
    // If it's an expired medicine and not being force-added, don't proceed
    if (expiredMedicine && expiredMedicine._id === medicineDetails?._id && !forceAdd) {
      return;
    }
    
    if (medicineDetails && medicineDetails.stock > 0) {
      if (onScanComplete) {
        // Set as last scanned to prevent duplicate adds
        setLastScanned(medicineDetails._id);
        
        // If adding expired medicine, clear expiredMedicine state
        if (expiredMedicine && expiredMedicine._id === medicineDetails._id && forceAdd) {
          setExpiredMedicine(null);
        }
        
        // Pass the continuousMode flag to prevent premature scanner closing
        onScanComplete(medicineDetails, continuousMode);
        setSuccessCount(prevCount => prevCount + 1);
        
        // Show brief success message
        const originalError = error;
        setError(null);
        setError(`Added ${medicineDetails.name} to cart`);
        
        // Reset state and resume scanning if in continuous mode
        if (continuousMode) {
          console.log("Attempting to resume scanning after adding item to cart");
          setMedicineDetails(null);
          setScanResult(null);
          
          // Resume scanning
          if (scannerRef.current) {
            try {
              // Force a small delay before resuming to ensure UI updates
              setTimeout(() => {
                // Clear the temporary success message
                setError(originalError);
                
                if (scannerRef.current) {
                  scannerRef.current.resume();
                  console.log("Scanner resumed successfully");
                } else {
                  console.error("Scanner reference lost before resuming");
                  startScanner(); // Try restarting scanner if reference is lost
                }
              }, 1000);
            } catch (err) {
              console.error("Error resuming scanner:", err);
              // If resume fails, try to restart the scanner
              startScanner();
            }
          } else {
            console.error("Scanner reference not available, restarting scanner");
            startScanner();
          }
        } else {
          // If not in continuous mode, close scanner after adding to cart
          handleClose();
        }
      }
    }
  };
  
  // Handle skip expired medicine
  const handleSkipExpired = () => {
    setExpiredMedicine(null);
    setMedicineDetails(null);
    setError(null);
    
    // Resume scanning
    if (scannerRef.current && continuousMode) {
      try {
        scannerRef.current.resume();
      } catch (err) {
        console.error("Error resuming scanner:", err);
        startScanner();
      }
    }
  };
  
  // Handle camera change
  const handleCameraChange = (e) => {
    setCameraId(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 md:mx-0">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {continuousMode ? 'Auto-Scan Mode' : 'Scan Barcode'}
              {continuousMode && successCount > 0 && ` (${successCount} added)`}
            </h2>
            
            {/* Mode toggle for billing */}
            {isBilling && (
              <div className="flex items-center">
                <span className="text-sm mr-2 text-gray-600">Auto-Add Items:</span>
                <button 
                  onClick={() => setContinuousMode(!continuousMode)} 
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${continuousMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${continuousMode ? 'translate-x-6' : 'translate-x-1'}`} 
                  />
                </button>
              </div>
            )}
          </div>
          
          {/* Scanner */}
          <div 
            id={scannerContainerId} 
            className="mb-4 min-h-[300px] border rounded-lg overflow-hidden flex items-center justify-center"
          >
            {!cameraId && cameras.length === 0 && (
              <div className="text-center p-4 text-gray-500">
                <CameraIcon className="h-10 w-10 mx-auto mb-2" />
                <p>Loading camera...</p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              <p className="mt-2 text-gray-600">Processing scan...</p>
            </div>
          )}

          {/* Expired Medicine Confirmation */}
          {expiredMedicine && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800">
                    Expired Medicine Detected
                  </h3>
                  <p className="text-sm text-amber-700 mb-2">
                    {expiredMedicine.name} has expired. Do you still want to add it to the cart?
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleAddToCart(true)}
                      className="px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md hover:bg-amber-200 flex-1 text-sm font-medium"
                    >
                      Add Anyway
                    </button>
                    <button
                      onClick={handleSkipExpired}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 border border-gray-300 rounded-md hover:bg-gray-200 flex-1 text-sm font-medium"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Message */}
          {error && !expiredMedicine && (
            <div className={`border-l-4 p-4 ${error.includes('Added') ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
              <div className="flex items-center">
                {error.includes('Added') ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                )}
                <p className={error.includes('Added') ? 'text-green-700' : 'text-red-700'}>{error}</p>
              </div>
            </div>
          )}

          {/* Scan Result - only show if not in continuous mode or the item can't be auto-added */}
          {medicineDetails && !loading && !expiredMedicine && (!continuousMode || medicineDetails.stock <= 0) && (
            <div className="bg-green-50 border rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                <div className="flex-1">
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
                    <div className="flex gap-2">
                      <dt className="font-medium">Price:</dt>
                      <dd>${medicineDetails.price.toFixed(2)}</dd>
                    </div>
                  </dl>
                  
                  {/* Add to Cart Button for non-continuous mode or out of stock items */}
                  {isBilling && medicineDetails.stock > 0 && !continuousMode && (
                    <button
                      onClick={() => handleAddToCart()}
                      className="mt-3 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 py-2 px-4 flex items-center justify-center"
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-2" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions for continuous mode */}
          {continuousMode && successCount === 0 && !medicineDetails && !expiredMedicine && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
              <p className="text-blue-700">Scan items to automatically add them to the cart</p>
              <p className="text-blue-500 text-sm mt-1">When finished, click the "Finish" button below</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between space-x-3 mt-4">
            {/* Close/Cancel Button */}
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosing ? 'Closing...' : (continuousMode ? 'Cancel' : 'Close')}
            </button>
            
            {/* Finish/View Details Button */}
            {(medicineDetails && !isBilling) ? (
              <button
                onClick={() => {
                  if (onScanComplete) onScanComplete(medicineDetails);
                  handleClose();
                }}
                disabled={isClosing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View Details
              </button>
            ) : (
              continuousMode && (
                <button
                  onClick={handleClose}
                  disabled={successCount === 0 || isClosing}
                  className={`px-4 py-2 ${successCount > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  {isClosing ? 'Finishing...' : `Finish ${successCount > 0 ? `(${successCount} items)` : ''}`}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner; 