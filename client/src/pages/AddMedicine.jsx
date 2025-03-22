import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ExclamationTriangleIcon, PlusCircleIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AddMedicine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // basic, supply, stock, medical, other

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    supplier: '',
    dosageForm: '',
    strength: '',
    packageSize: '',
    unit: '',
    price: '',
    costPrice: '',
    minimumStock: '',
    stock: '',
    location: '',
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    description: '',
    sideEffects: '',
    contraindications: '',
    storageInstructions: '',
    usageInstructions: '',
    prescriptionRequired: false,
    controlledSubstance: false,
    reorderLevel: '',
    therapeuticCategory: '',
    barcode: '',
    notes: ''
  });

  const categories = [
    'antibiotics',
    'painkillers',
    'vitamins',
    'antiviral',
    'anticold',
    'antidiabetic',
    'cardiovascular',
    'gastrointestinal',
    'respiratory',
    'other'
  ];

  const dosageForms = [
    'Tablet',
    'Capsule',
    'Liquid',
    'Injection',
    'Cream',
    'Ointment',
    'Gel',
    'Drops',
    'Inhaler',
    'Patch',
    'Suppository'
  ];

  const units = [
    'tablet',
    'bottle',
    'strip',
    'box',
    'vial',
    'ampule',
    'tube',
    'sachet',
    'capsule',
    'other'
  ];

  const therapeuticCategories = [
    'Analgesics',
    'Antibiotics',
    'Antidiabetics',
    'Antihypertensives',
    'Antihistamines',
    'Antipyretics',
    'Antacids',
    'Antidepressants',
    'Antifungals',
    'Antivirals',
    'Vitamins',
    'Supplements'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/medicines`, formData);
      setSuccess(true);
      setGeneratedBarcode(response.data.barcode);
      setTimeout(() => {
        navigate('/inventory');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medicine');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-400 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Medicine Added Successfully!</h2>
          <p className="text-green-600 mb-4">The medicine has been added to the inventory.</p>
          {generatedBarcode && (
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Generated Barcode:</p>
              <p className="font-mono text-lg">{generatedBarcode}</p>
            </div>
          )}
          <p className="text-gray-600">Redirecting to inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8 border-b pb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Medicine</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill out the form below to add a new medicine to your inventory
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('supply')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'supply'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manufacturer & Supply
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stock'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stock & Price
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medical'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medical Information
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        {/* Basic Information Section */}
        <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="genericName" className="block text-sm font-medium text-gray-700 mb-1">
                Generic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="genericName"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dosageForm" className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Form <span className="text-red-500">*</span>
              </label>
              <select
                id="dosageForm"
                name="dosageForm"
                value={formData.dosageForm}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              >
                <option value="">Select Dosage Form</option>
                {dosageForms.map(form => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('supply')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next: Manufacturer & Supply
            </button>
          </div>
        </div>

        {/* Additional sections for supply, stock, medical info - to be implemented similar to above */}
        <div className={activeTab === 'supply' ? 'block' : 'hidden'}>
          {/* Supply section fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next: Stock & Price
            </button>
          </div>
        </div>

        <div className={activeTab === 'stock' ? 'block' : 'hidden'}>
          {/* Stock & Price section fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="tablet">Tablet</option>
                <option value="bottle">Bottle</option>
                <option value="strip">Strip</option>
                <option value="box">Box</option>
                <option value="vial">Vial</option>
                <option value="ampule">Ampule</option>
                <option value="tube">Tube</option>
                <option value="sachet">Sachet</option>
                <option value="capsule">Capsule</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="costPrice"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('supply')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('medical')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next: Medical Information
            </button>
          </div>
        </div>

        <div className={activeTab === 'medical' ? 'block' : 'hidden'}>
          {/* Medical Info section fields */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            ></textarea>
          </div>
          
          <div className="flex items-center mb-6">
            <input
              id="prescriptionRequired"
              name="prescriptionRequired"
              type="checkbox"
              checked={formData.prescriptionRequired}
              onChange={(e) => 
                setFormData({
                  ...formData,
                  prescriptionRequired: e.target.checked
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="prescriptionRequired" className="ml-2 block text-sm text-gray-900">
              Prescription Required
            </label>
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Medicine
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddMedicine; 