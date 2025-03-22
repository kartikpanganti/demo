import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Barcode from 'react-barcode';
import { API_BASE_URL } from '../config';
import BarcodeGenerator from '../components/BarcodeGenerator';
import BarcodeScanner from '../components/BarcodeScanner';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';

const ShowMedicine = () => {
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/medicines/${id}`);
        setMedicine(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  // Fetch scan history
  const fetchScanHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/medicines/${id}/scan-history`);
      setScanHistory(response.data.scanHistory);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchScanHistory();
    }
  }, [id]);
  
  // Handle barcode scan completion
  const handleScanComplete = async (scannedMedicine) => {
    if (scannedMedicine._id === medicine._id) {
      setMedicine(scannedMedicine);
      fetchScanHistory();
    } else {
      alert('Scanned medicine does not match the current medicine!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Medicine not found</div>
      </div>
    );
  }

  // Calculate days until expiry
  const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <Link to="/inventory" className="text-blue-600 hover:text-blue-800">
          ← Back to Inventory
        </Link>
        <Link to={`/edit/${id}`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Edit Medicine
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Header Section */}
          <div className="border-b pb-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{medicine.name}</h2>
            <p className="text-lg text-gray-600 mt-2">{medicine.manufacturer}</p>
          </div>
          
          {/* Alert Sections */}
          {medicine.stock <= medicine.minimumStock && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Low Stock Alert!</p>
              <p>Current stock ({medicine.stock} {medicine.unit}) is below minimum stock level ({medicine.minimumStock} {medicine.unit})</p>
            </div>
          )}

          {isExpiringSoon && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">Expiring Soon!</p>
              <p>This medicine will expire in {daysUntilExpiry} days</p>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Expired!</p>
              <p>This medicine has expired and should not be dispensed</p>
            </div>
          )}

          {/* Barcode Section */}
          <div className="mb-8 flex justify-center">
            <div className="p-4 border rounded-lg bg-white">
              <Barcode value={medicine.barcode} />
              <p className="text-center mt-2 text-sm text-gray-600">Barcode: {medicine.barcode}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Basic Information</h3>
              <div className="grid gap-4">
                <DetailItem label="Generic Name" value={medicine.genericName || 'N/A'} />
                <DetailItem label="Brand Name" value={medicine.name} />
                <DetailItem label="Manufacturer" value={medicine.manufacturer} />
                <DetailItem label="Category" value={medicine.category} />
                <DetailItem label="Dosage Form" value={medicine.dosageForm || 'N/A'} />
                <DetailItem label="Strength" value={medicine.strength || 'N/A'} />
              </div>
            </div>

            {/* Inventory Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Inventory Details</h3>
              <div className="grid gap-4">
                <DetailItem 
                  label="Current Stock" 
                  value={`${medicine.stock} ${medicine.unit}`}
                  className={medicine.stock <= medicine.minimumStock ? 'text-red-600' : ''}
                />
                <DetailItem label="Minimum Stock Level" value={`${medicine.minimumStock} ${medicine.unit}`} />
                <DetailItem label="Unit of Measurement" value={medicine.unit} />
                <DetailItem label="Location" value={medicine.location} />
                <DetailItem label="Price" value={`$${medicine.price.toFixed(2)}`} />
                <DetailItem label="Batch Number" value={medicine.batchNumber} />
              </div>
            </div>

            {/* Storage and Expiry */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Storage & Expiry</h3>
              <div className="grid gap-4">
                <DetailItem 
                  label="Expiry Date" 
                  value={new Date(medicine.expiryDate).toLocaleDateString()}
                  className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}
                />
                <DetailItem label="Days Until Expiry" value={`${daysUntilExpiry} days`} />
                <DetailItem label="Storage Conditions" value={medicine.storageConditions || 'Store in a cool, dry place'} />
                <DetailItem label="Storage Temperature" value={medicine.storageTemp || 'Room temperature'} />
              </div>
            </div>

            {/* Clinical Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Clinical Information</h3>
              <div className="grid gap-4">
                <DetailItem label="Therapeutic Category" value={medicine.therapeuticCategory || 'N/A'} />
                <DetailItem label="Prescription Required" value={medicine.prescriptionRequired ? 'Yes' : 'No'} />
                <DetailItem label="Controlled Substance" value={medicine.controlledSubstance ? 'Yes' : 'No'} />
                <DetailItem label="Side Effects" value={medicine.sideEffects || 'Refer to package insert'} />
                <DetailItem label="Contraindications" value={medicine.contraindications || 'Refer to package insert'} />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Additional Information</h3>
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{medicine.description}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Usage Instructions</h4>
                <p className="text-gray-600">{medicine.usageInstructions || 'Follow prescription instructions'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-gray-600">{medicine.notes || 'No additional notes'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Barcode Actions */}
      <div className="mt-8 space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowBarcodeGenerator(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Generate Barcode/QR Code
          </button>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Scan Barcode
          </button>
        </div>
        
        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scan History</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {scanHistory.map((scan, index) => (
                  <li key={index} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {scan.action.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(scan.timestamp).toLocaleString()}
                        </p>
                        {scan.notes && (
                          <p className="text-sm text-gray-600 mt-1">{scan.notes}</p>
                        )}
                      </div>
                      {scan.quantity !== 0 && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          scan.action === 'stock_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {scan.action === 'stock_in' ? '+' : '-'}{scan.quantity} units
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Barcode Generator Modal */}
      {showBarcodeGenerator && (
        <BarcodeGenerator
          medicine={medicine}
          onClose={() => setShowBarcodeGenerator(false)}
        />
      )}
      
      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
};

// Helper component for displaying detail items
const DetailItem = ({ label, value, className = '' }) => (
  <div className="border-b pb-2">
    <span className="font-medium text-gray-700">{label}: </span>
    <span className={`text-gray-600 ${className}`}>{value}</span>
  </div>
);

export default ShowMedicine; 