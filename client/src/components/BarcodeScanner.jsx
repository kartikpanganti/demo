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
  ShoppingCartIcon
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
  
  // Start scanner when cameraId is selected
  useEffect(() => {
    if (cameraId) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [cameraId]);
  
  const startScanner = async () => {
    try {
      stopScanner(); // Stop any existing scanner first
      
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
        // Resume scanning in continuous mode even on error
        if (continuousMode && scannerRef.current) {
          setTimeout(() => scannerRef.current.resume(), 2000);
        }
        return;
      } else if (daysUntilExpiry <= 30) {
        setError(`Warning: Medicine expires in ${daysUntilExpiry} days`);
      }
      
      if (medicine.stock <= 0) {
        setError(`This medicine is out of stock!`);
        // Resume scanning in continuous mode even on error
        if (continuousMode && scannerRef.current) {
          setTimeout(() => scannerRef.current.resume(), 2000);
        }
        return;
      }
      
      // For billing mode handling
      if (isBilling) {
        if (continuousMode) {
          // For continuous mode, auto-add to cart after a short delay
          setTimeout(() => {
            // Only auto-add if we haven't encountered any errors
            if (!error) {
              handleAddToCart(); // This will call onScanComplete with the continuousMode flag
            } else {
              // If there's an error but we're in continuous mode, resume scanning
              if (scannerRef.current) {
                scannerRef.current.resume();
              }
            }
          }, 1000);
        } else {
          // For non-continuous mode, close after a delay
          setTimeout(() => {
            if (onScanComplete) {
              onScanComplete(medicine, false); // Not continuous - normal close behavior
            }
          }, 1000);
        }
      } else if (onScanComplete && !isBilling) {
        onScanComplete(medicine, false); // Not continuous - normal close behavior
      }
    } catch (err) {
      // Resume scanning in continuous mode after error
      if (continuousMode && scannerRef.current) {
        setTimeout(() => scannerRef.current.resume(), 2000);
      }
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  // Handle barcode data
  const handleBarcodeData = async (barcode) => {
    try {
      if (!barcode) {
        throw new Error('Invalid barcode');
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/medicines/barcode/${barcode}`);
        const medicine = response.data;
        
        setMedicineDetails(medicine);
        
        // Check expiry for billing
        if (isBilling) {
          const expiryDate = new Date(medicine.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 0) {
            setError('WARNING: This medicine has expired! Cannot add to cart.');
            // Resume scanning in continuous mode even on error
            if (continuousMode && scannerRef.current) {
              setTimeout(() => scannerRef.current.resume(), 2000);
            }
            return;
          } else if (daysUntilExpiry <= 30) {
            setError(`Warning: Medicine expires in ${daysUntilExpiry} days`);
          }
          
          if (medicine.stock <= 0) {
            setError(`This medicine is out of stock!`);
            // Resume scanning in continuous mode even on error
            if (continuousMode && scannerRef.current) {
              setTimeout(() => scannerRef.current.resume(), 2000);
            }
            return;
          }
          
          if (continuousMode) {
            // For continuous mode, auto-add to cart after a short delay
            setTimeout(() => {
              // Only auto-add if we haven't encountered any errors
              if (!error) {
                handleAddToCart(); // This will call onScanComplete with the continuousMode flag
              } else {
                // If there's an error but we're in continuous mode, resume scanning
                if (scannerRef.current) {
                  scannerRef.current.resume();
                }
              }
            }, 1000);
          } else {
            // For non-continuous mode, close after a delay
            setTimeout(() => {
              if (onScanComplete) {
                onScanComplete(medicine, false); // Not continuous - normal close behavior
              }
            }, 1000);
          }
        } else if (onScanComplete && !isBilling) {
          onScanComplete(medicine, false); // Not continuous - normal close behavior
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Check if it's a 404 (not found) or a server error
        if (apiError.response) {
          if (apiError.response.status === 404) {
            setError(`Product with barcode ${barcode} not found in the system`);
          } else {
            setError(`Server error: ${apiError.response.data.message || 'Unknown error'}`);
          }
        } else if (apiError.request) {
          // Request was made but no response received (network issue)
          setError('Network error. Please check your connection');
        } else {
          setError('Error fetching medicine: ' + apiError.message);
        }
        
        // Resume scanning in continuous mode after error
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
      await stopScanner();
      onClose();
    } catch (err) {
      console.error('Error during close:', err);
      onClose();
    }
  };

  // Function to handle adding to cart directly from the scanner
  const handleAddToCart = () => {
    if (medicineDetails && medicineDetails.stock > 0) {
      if (onScanComplete) {
        // Pass the continuousMode flag to prevent premature scanner closing
        onScanComplete(medicineDetails, continuousMode);
        setSuccessCount(prevCount => prevCount + 1);
        
        // Reset state and resume scanning if in continuous mode
        if (continuousMode) {
          console.log("Attempting to resume scanning after adding item to cart");
          setMedicineDetails(null);
          setScanResult(null);
          setError(null);
          
          // Resume scanning
          if (scannerRef.current) {
            try {
              // Force a small delay before resuming to ensure UI updates
              setTimeout(() => {
                if (scannerRef.current) {
                  scannerRef.current.resume();
                  console.log("Scanner resumed successfully");
                } else {
                  console.error("Scanner reference lost before resuming");
                  startScanner(); // Try restarting scanner if reference is lost
                }
              }, 500);
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
              Scan Barcode
              {continuousMode && successCount > 0 && ` (${successCount} added)`}
            </h2>
            
            {/* Mode toggle for billing */}
            {isBilling && (
              <div className="flex items-center">
                <span className="text-sm mr-2 text-gray-600">Continuous Scan:</span>
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

          {/* Camera selector */}
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Camera</label>
              <select
                value={cameraId || ''}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
                  
                  {/* Add to Cart Button for Billing */}
                  {isBilling && medicineDetails.stock > 0 && (
                    <button
                      onClick={handleAddToCart}
                      className="mt-3 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 py-2 px-4 flex items-center justify-center"
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-2" />
                      Add to Cart {continuousMode && "& Continue Scanning"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between space-x-3 mt-4">
            {/* Close/Cancel Button */}
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {continuousMode ? 'Stop Scanning' : 'Close'}
            </button>
            
            {/* Finish/View Details Button */}
            {(medicineDetails && !isBilling) ? (
              <button
                onClick={() => {
                  if (onScanComplete) onScanComplete(medicineDetails);
                  handleClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Details
              </button>
            ) : (
              continuousMode && successCount > 0 && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Finish ({successCount} items)
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