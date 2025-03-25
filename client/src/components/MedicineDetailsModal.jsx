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
  ArrowDownTrayIcon,
  PrinterIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import BarcodeGenerator from './BarcodeGenerator';

const MedicineDetailsModal = ({ isOpen, onClose, medicineId, onAddToBill }) => {
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [animateIn, setAnimateIn] = useState(false);
  const [addToCartQuantity, setAddToCartQuantity] = useState(1);
  const [isBarcodeVisible, setIsBarcodeVisible] = useState(false);
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
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
          setShowBarcodeGenerator(false);
        } catch (err) {
          setError(err.message || 'Failed to load medicine details');
          setLoading(false);
        }
      };
      
      fetchMedicineDetails();
      
      // Add animation delay
      setAnimateIn(false);
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, [isOpen, medicineId]);

  // Handle closing the modal with animation
  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  // Generate barcode 
  const generateBarcode = async () => {
    if (!medicine || !medicine._id) return;
    
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/medicines/${medicine._id}/generate-barcode`
      );
      
      // Update medicine with the new barcode
      setMedicine(response.data.medicine);
      setLoading(false);
      
      // Show the barcode
      setIsBarcodeVisible(true);
    } catch (err) {
      setError('Failed to generate barcode: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };
  
  // Open barcode generator 
  const openBarcodeGenerator = () => {
    if (!medicine || !medicine._id) return;
    
    // If no barcode exists, generate one first
    if (!medicine.barcode) {
      generateBarcode().then(() => {
        setShowBarcodeGenerator(true);
      });
    } else {
      setShowBarcodeGenerator(true);
    }
  };
  
  // Add to bill
  const handleAddToBill = () => {
    if (onAddToBill && medicine && medicine.stock > 0) {
      onAddToBill(medicine, addToCartQuantity);
      
      // Add a success animation to the Add to Bill button
      const button = document.getElementById('add-to-bill-button');
      if (button) {
        button.classList.add('animate-success');
        setTimeout(() => {
          button.classList.remove('animate-success');
        }, 1000);
      }
    }
  };
  
  const getExpiryStatus = (date) => {
    if (!date) return { status: 'unknown', label: 'Unknown' };
    
    const expiryDate = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return { status: 'expired', label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'critical', label: `Expires in ${daysUntilExpiry} days` };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', label: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'good', label: `Expires in ${daysUntilExpiry} days` };
    }
  };
  
  // Calculate if we should show the add to bill option
  const showAddToBill = !!onAddToBill && medicine && medicine.stock > 0;
  
  // If modal is not open, don't render
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>
      
      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col shadow-xl transform transition-all ${
          animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold truncate">
              {medicine?.name || 'Medicine Details'}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white sticky top-[60px] z-10">
          <div className="px-6">
            <nav className="flex space-x-6 overflow-x-auto">
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
        
        {/* Content Area - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
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
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <DetailItem label="Name" value={medicine.name} />
                      <DetailItem label="Manufacturer" value={medicine.manufacturer} />
                      <DetailItem label="Category" value={medicine.category || 'Uncategorized'} />
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
                    <div className="flex flex-wrap justify-center space-x-2 mb-4">
                      <button 
                        onClick={() => setIsBarcodeVisible(!isBarcodeVisible)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <QrCodeIcon className="h-5 w-5 mr-2" />
                        {isBarcodeVisible ? 'Hide Barcode' : 'Show Barcode'}
                      </button>
                      
                      <button 
                        onClick={openBarcodeGenerator}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        Generate & Print Barcode
                      </button>
                    </div>
                    
                    {!medicine.barcode && (
                      <p className="text-sm text-gray-500 italic mb-3">
                        No barcode available. Click "Generate & Print Barcode" to create one.
                      </p>
                    )}
                    
                    {isBarcodeVisible && medicine.barcode && (
                      <div className="mt-4 inline-block p-4 border rounded-lg bg-white shadow-sm animate-fadeIn">
                        <div className="flex flex-col items-center">
                          <Barcode value={medicine.barcode} />
                          <p className="text-center mt-2 text-sm text-gray-600 font-medium">{medicine.barcode}</p>
                          <p className="text-center text-sm text-gray-700 font-semibold mt-1">{medicine.name}</p>
                        </div>
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
                        value={medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : 'N/A'} 
                        highlight={getExpiryStatus(medicine.expiryDate).status !== 'good'}
                        highlightColor={getExpiryStatus(medicine.expiryDate).status === 'expired' ? 'red' : 'yellow'}
                      />
                      <DetailItem label="Unit Price" value={`$${medicine.price.toFixed(2)}`} />
                      <DetailItem label="Supplier" value={medicine.supplier || 'N/A'} />
                    </div>
                  </div>
                  
                  {/* Stock Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg shadow-sm border flex items-center 
                      ${medicine.stock <= 0 ? 
                        'bg-red-50 border-red-200' : 
                        medicine.stock <= medicine.minimumStock ? 
                        'bg-yellow-50 border-yellow-200' : 
                        'bg-green-50 border-green-200'}`}>
                      <div className={`p-3 rounded-full mr-4
                        ${medicine.stock <= 0 ? 
                          'bg-red-100 text-red-500' : 
                          medicine.stock <= medicine.minimumStock ? 
                          'bg-yellow-100 text-yellow-500' : 
                          'bg-green-100 text-green-500'}`}>
                        <ArchiveBoxIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Stock Status</h4>
                        <p className={`
                          ${medicine.stock <= 0 ? 
                            'text-red-600' : 
                            medicine.stock <= medicine.minimumStock ? 
                            'text-yellow-600' : 
                            'text-green-600'}`}>
                          {medicine.stock <= 0 ? 
                            'Out of Stock' : 
                            medicine.stock <= medicine.minimumStock ? 
                            'Low Stock' : 
                            'In Stock'} ({medicine.stock} {medicine.unit})
                        </p>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg shadow-sm border flex items-center 
                      ${getExpiryStatus(medicine.expiryDate).status === 'expired' ? 
                        'bg-red-50 border-red-200' : 
                        getExpiryStatus(medicine.expiryDate).status === 'critical' ? 
                        'bg-red-50 border-red-200' : 
                        getExpiryStatus(medicine.expiryDate).status === 'warning' ? 
                        'bg-yellow-50 border-yellow-200' : 
                        'bg-green-50 border-green-200'}`}>
                      <div className={`p-3 rounded-full mr-4
                        ${getExpiryStatus(medicine.expiryDate).status === 'expired' ? 
                          'bg-red-100 text-red-500' : 
                          getExpiryStatus(medicine.expiryDate).status === 'critical' ? 
                          'bg-red-100 text-red-500' : 
                          getExpiryStatus(medicine.expiryDate).status === 'warning' ? 
                          'bg-yellow-100 text-yellow-500' : 
                          'bg-green-100 text-green-500'}`}>
                        <ClockIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700">Expiry Status</h4>
                        <p className={`
                          ${getExpiryStatus(medicine.expiryDate).status === 'expired' ? 
                            'text-red-600' : 
                            getExpiryStatus(medicine.expiryDate).status === 'critical' ? 
                            'text-red-600' : 
                            getExpiryStatus(medicine.expiryDate).status === 'warning' ? 
                            'text-yellow-600' : 
                            'text-green-600'}`}>
                          {getExpiryStatus(medicine.expiryDate).label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Clinical Info Tab */}
              {activeTab === 'clinical' && (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BeakerIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Clinical Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <DetailItem label="Generic Name" value={medicine.genericName || 'N/A'} />
                      <DetailItem label="Mechanism of Action" value={medicine.mechanismOfAction || 'N/A'} />
                      <DetailItem 
                        label="Controlled Substance" 
                        value={medicine.controlledSubstance ? 'Yes' : 'No'} 
                        highlight={medicine.controlledSubstance}
                        highlightColor="red"
                      />
                      <DetailItem label="FDA Schedule" value={medicine.fdaSchedule || 'N/A'} />
                    </div>
                    
                    <div className="mt-5">
                      <h4 className="font-medium text-gray-700 mb-2">Indications</h4>
                      <p className="text-gray-700 whitespace-pre-line">
                        {medicine.indications || 'No indication information available'}
                      </p>
                    </div>
                    
                    <div className="mt-5">
                      <h4 className="font-medium text-gray-700 mb-2">Contraindications</h4>
                      <p className="text-gray-700 whitespace-pre-line">
                        {medicine.contraindications || 'No contraindication information available'}
                      </p>
                    </div>
                    
                    <div className="mt-5">
                      <h4 className="font-medium text-gray-700 mb-2">Side Effects</h4>
                      <p className="text-gray-700 whitespace-pre-line">
                        {medicine.sideEffects || 'No side effect information available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Notes & Special Instructions
                    </h3>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {medicine.notes ? (
                        <p className="whitespace-pre-line text-gray-700">{medicine.notes}</p>
                      ) : (
                        <p className="text-gray-500 italic">No notes available for this medicine</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {medicine && !loading && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  medicine.stock <= 0 ? 
                  'bg-red-100 text-red-800' : 
                  medicine.stock <= medicine.minimumStock ? 
                  'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
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
                <div className="flex items-center flex-wrap">
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
              )}
              
              {!showAddToBill && (
                <Link 
                  to={`/edit/${medicine._id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                >
                  <PencilIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Edit Details
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Barcode Generator Modal */}
      {showBarcodeGenerator && medicine && (
        <BarcodeGenerator 
          medicine={medicine} 
          onClose={() => setShowBarcodeGenerator(false)} 
        />
      )}
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