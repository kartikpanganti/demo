import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Barcode from 'react-barcode';
import { API_BASE_URL } from '../config';
import { 
  XMarkIcon, 
  PencilIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  InformationCircleIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const MedicineDetailsModal = ({ isOpen, onClose, medicineId, onAddToBill }) => {
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [animateIn, setAnimateIn] = useState(false);
  const [addToCartQuantity, setAddToCartQuantity] = useState(1);
  const [isBarcodeVisible, setIsBarcodeVisible] = useState(false);
  
  // Fetch medicine details when the modal opens
  useEffect(() => {
    if (isOpen && medicineId) {
      setLoading(true);
      setError(null);
      
      const fetchMedicineDetails = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/medicines/${medicineId}`);
          setMedicine(response.data);
          setLoading(false);
          
          // Reset other states when new medicine is loaded
          setActiveTab('overview');
          setAddToCartQuantity(1);
          setIsBarcodeVisible(false);
        } catch (err) {
          setError(err.message || 'Failed to load medicine details');
          setLoading(false);
        }
      };
      
      fetchMedicineDetails();
      
      // Trigger entrance animation
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen, medicineId]);
  
  // Handle modal closing with animation
  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
      // Don't reset medicine state immediately to avoid UI flicker
    }, 300);
  };
  
  const handleAddToBill = () => {
    if (medicine && onAddToBill && medicine.stock >= addToCartQuantity) {
      onAddToBill(medicine, addToCartQuantity);
      
      // Show confirmation animation
      const button = document.getElementById('add-to-bill-button');
      if (button) {
        button.classList.add('animate-success');
        setTimeout(() => {
          button.classList.remove('animate-success');
        }, 1000);
      }
    }
  };
  
  // Add to Bill section visibility
  const showAddToBill = !!onAddToBill;
  
  if (!isOpen) return null;
  
  // Calculate days until expiry
  const calculateExpiryStatus = () => {
    if (!medicine) return { days: 0, isExpired: false, isExpiringSoon: false };
    
    const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      days: daysUntilExpiry,
      isExpired: daysUntilExpiry <= 0,
      isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30
    };
  };
  
  const { days, isExpired, isExpiringSoon } = calculateExpiryStatus();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div 
        className={`relative w-full max-w-4xl bg-white rounded-xl shadow-2xl transition-all duration-300 transform ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header with background gradient */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="pr-10">
              {loading ? (
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              ) : medicine ? (
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight group">
                  {medicine.name}
                  {medicine.prescriptionRequired && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Rx
                    </span>
                  )}
                </h2>
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">Medicine Details</h2>
              )}
              
              {medicine && (
                <div className="mt-1 text-sm text-gray-600 flex items-center">
                  <span>{medicine.manufacturer}</span>
                  <span className="mx-2">•</span>
                  <span>{medicine.category}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClose}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Status Indicators */}
          {medicine && (
            <div className="mt-4 flex flex-wrap gap-2">
              {medicine.stock <= medicine.minimumStock && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Low Stock
                </div>
              )}
              
              {isExpired && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Expired
                </div>
              )}
              
              {isExpiringSoon && !isExpired && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Expires in {days} days
                </div>
              )}
              
              {medicine.controlledSubstance && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  Controlled
                </div>
              )}
            </div>
          )}
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 ${activeTab === 'overview' ? 
                  'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 
                  'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'} 
                  transition-colors whitespace-nowrap flex items-center`}
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 px-1 ${activeTab === 'inventory' ? 
                  'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 
                  'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'} 
                  transition-colors whitespace-nowrap flex items-center`}
              >
                <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('clinical')}
                className={`pb-3 px-1 ${activeTab === 'clinical' ? 
                  'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 
                  'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'} 
                  transition-colors whitespace-nowrap flex items-center`}
              >
                <BeakerIcon className="h-5 w-5 mr-2" />
                Clinical Info
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-1 ${activeTab === 'notes' ? 
                  'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 
                  'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'} 
                  transition-colors whitespace-nowrap flex items-center`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Notes
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="text-gray-500">Loading medicine details...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded max-w-lg">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Medicine Content */}
          {medicine && !loading && (
            <div className="animate-fadeIn">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-2">Current Stock</h3>
                      <p className={`text-3xl font-bold ${medicine.stock <= medicine.minimumStock ? 'text-red-600' : 'text-blue-900'}`}>
                        {medicine.stock} <span className="text-lg font-normal">{medicine.unit}</span>
                      </p>
                      <p className="mt-1 text-xs text-blue-600">
                        Minimum: {medicine.minimumStock} {medicine.unit}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-sm border border-purple-200">
                      <h3 className="text-sm font-medium text-purple-700 uppercase tracking-wider mb-2">Expiry Date</h3>
                      <p className={`text-3xl font-bold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-purple-900'}`}>
                        {new Date(medicine.expiryDate).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-purple-600">
                        {isExpired ? 'Expired' : `${days} days remaining`}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-sm border border-green-200">
                      <h3 className="text-sm font-medium text-green-700 uppercase tracking-wider mb-2">Price</h3>
                      <p className="text-3xl font-bold text-green-900">${medicine.price.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-green-600">
                        Batch: {medicine.batchNumber}
                      </p>
                    </div>
                  </div>
                  
                  {/* Basic Info Card */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <DetailItem label="Generic Name" value={medicine.genericName || 'N/A'} />
                      <DetailItem label="Brand Name" value={medicine.name} />
                      <DetailItem label="Manufacturer" value={medicine.manufacturer} />
                      <DetailItem label="Category" value={medicine.category} />
                      <DetailItem label="Dosage Form" value={medicine.dosageForm || 'N/A'} />
                      <DetailItem label="Strength" value={medicine.strength || 'N/A'} />
                      <DetailItem label="Location" value={medicine.location || 'N/A'} />
                      <DetailItem 
                        label="Prescription Required" 
                        value={medicine.prescriptionRequired ? 'Yes' : 'No'} 
                        highlight={medicine.prescriptionRequired}
                      />
                    </div>
                  </div>
                  
                  {/* Barcode Section */}
                  <div className="text-center">
                    <button 
                      onClick={() => setIsBarcodeVisible(!isBarcodeVisible)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {isBarcodeVisible ? 'Hide Barcode' : 'Show Barcode'}
                    </button>
                    
                    {isBarcodeVisible && (
                      <div className="mt-4 inline-block p-4 border rounded-lg bg-white shadow-sm animate-fadeIn">
                        <Barcode value={medicine.barcode} />
                        <p className="text-center mt-2 text-sm text-gray-600">{medicine.barcode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <ArchiveBoxIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Inventory Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <DetailItem 
                        label="Current Stock" 
                        value={`${medicine.stock} ${medicine.unit}`} 
                        highlight={medicine.stock <= medicine.minimumStock}
                        highlightColor="red"
                      />
                      <DetailItem label="Minimum Stock Level" value={`${medicine.minimumStock} ${medicine.unit}`} />
                      <DetailItem label="Unit of Measurement" value={medicine.unit} />
                      <DetailItem label="Location" value={medicine.location} />
                      <DetailItem label="Batch Number" value={medicine.batchNumber} />
                      <DetailItem 
                        label="Expiry Date" 
                        value={new Date(medicine.expiryDate).toLocaleDateString()}
                        highlight={isExpired || isExpiringSoon}
                        highlightColor={isExpired ? "red" : "yellow"}
                      />
                      <DetailItem label="Storage Conditions" value={medicine.storageConditions || 'Store in a cool, dry place'} />
                      <DetailItem label="Storage Temperature" value={medicine.storageTemp || 'Room temperature'} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Clinical Info Tab */}
              {activeTab === 'clinical' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BeakerIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Clinical Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <DetailItem label="Therapeutic Category" value={medicine.therapeuticCategory || 'N/A'} />
                      <DetailItem 
                        label="Prescription Required" 
                        value={medicine.prescriptionRequired ? 'Yes' : 'No'} 
                        highlight={medicine.prescriptionRequired}
                      />
                      <DetailItem 
                        label="Controlled Substance" 
                        value={medicine.controlledSubstance ? 'Yes' : 'No'} 
                        highlight={medicine.controlledSubstance}
                      />
                      <DetailItem label="Dosage" value={medicine.dosage || 'As prescribed'} />
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Side Effects</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {medicine.sideEffects || 'Refer to package insert for complete list of side effects.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Contraindications</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {medicine.contraindications || 'Refer to package insert for contraindications.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Additional Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {medicine.description || 'No description available.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Usage Instructions</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {medicine.usageInstructions || 'Follow prescription instructions.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {medicine.notes || 'No additional notes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        {medicine && !loading && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                medicine.stock <= 0 ? 'text-red-600' : 
                medicine.stock <= medicine.minimumStock ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {medicine.stock <= 0 ? 'Out of Stock' : 
                 medicine.stock <= medicine.minimumStock ? 'Low Stock' : 
                 'In Stock'}
              </span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-600">
                {medicine.stock} {medicine.unit} available
              </span>
            </div>
            
            {/* Add to Bill options */}
            {showAddToBill && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mr-4">
                    Quantity:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      className="px-3 py-1 text-gray-500 hover:text-gray-700 bg-gray-50"
                      onClick={() => setAddToCartQuantity(Math.max(1, addToCartQuantity - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={medicine?.stock || 1}
                      value={addToCartQuantity}
                      onChange={(e) => setAddToCartQuantity(Math.min(medicine?.stock || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center border-0"
                    />
                    <button
                      type="button"
                      className="px-3 py-1 text-gray-500 hover:text-gray-700 bg-gray-50"
                      onClick={() => setAddToCartQuantity(Math.min(medicine?.stock || 1, addToCartQuantity + 1))}
                    >
                      +
                    </button>
                  </div>
                  <button
                    id="add-to-bill-button"
                    type="button"
                    className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    onClick={handleAddToBill}
                    disabled={medicine?.stock < 1}
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Add to Bill
                  </button>
                </div>
              </div>
            )}
            
            <Link 
              to={`/edit/${medicine._id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
            >
              <PencilIcon className="h-5 w-5 mr-2 text-gray-500" />
              Edit Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for detail items
const DetailItem = ({ label, value, highlight = false, highlightColor = "blue" }) => {
  const highlightClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
  };
  
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm ${highlight ? highlightClasses[highlightColor] : "text-gray-900"} font-medium`}>
        {value}
      </dd>
    </div>
  );
};

export default MedicineDetailsModal; 