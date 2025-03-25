import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ExclamationTriangleIcon, CheckCircleIcon, ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    supplier: '',
    batchNumber: '',
    expiryDate: '',
    dosageForm: '',
    strength: '',
    stock: 0,
    unit: 'tablet',
    price: 0,
    costPrice: 0,
    location: '',
    description: '',
    prescriptionRequired: false,
  });

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/medicines/${id}`);
        
        // Format date for input field (YYYY-MM-DD)
        const medicine = response.data;
        if (medicine.expiryDate) {
          const date = new Date(medicine.expiryDate);
          medicine.expiryDate = date.toISOString().split('T')[0];
        }
        
        setFormData(medicine);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch medicine. Please try again.');
        setLoading(false);
        console.error('Error fetching medicine:', error);
      }
    };

    fetchMedicine();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const inputValue = type === 'checkbox' ? checked : 
                       (type === 'number' ? parseFloat(value) : value);
    
    setFormData({
      ...formData,
      [name]: inputValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/medicines/${id}`, formData);
      setSuccess(true);
      setLoading(false);
      window.scrollTo(0, 0);
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update medicine. Please try again.');
      setLoading(false);
      window.scrollTo(0, 0);
      console.error('Error updating medicine:', error);
    }
  };

    return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8 border-b pb-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Medicine</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update details for {formData.name || 'this medicine'}
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

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
        
        {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">
              Medicine updated successfully! Redirecting to inventory...
            </p>
            </div>
          </div>
        )}

      {!loading && (
        <>
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
                    <option value="antibiotics">Antibiotics</option>
                    <option value="painkillers">Painkillers</option>
                    <option value="vitamins">Vitamins</option>
                    <option value="antiviral">Antiviral</option>
                    <option value="anticold">Anticold</option>
                    <option value="antidiabetic">Antidiabetic</option>
                    <option value="cardiovascular">Cardiovascular</option>
                    <option value="gastrointestinal">Gastrointestinal</option>
                    <option value="respiratory">Respiratory</option>
                    <option value="other">Other</option>
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
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Gel">Gel</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Patch">Patch</option>
                    <option value="Suppository">Suppository</option>
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

            {/* Additional sections for supply, stock, medical info */}
            <div className={activeTab === 'supply' ? 'block' : 'hidden'}>
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
              <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
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
              <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Location
                  </label>
                <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                  onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
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
              <div>
                <label htmlFor="strength" className="block text-sm font-medium text-gray-700 mb-1">
                  Strength/Dosage
                </label>
                <input
                  type="text"
                  id="strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g., 500mg, 10mg/ml"
                />
          </div>

              <div className="mt-4">
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
              
              <div className="mt-4 flex items-center">
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
                      <PencilSquareIcon className="h-5 w-5 mr-2" />
                      Update Medicine
                    </>
                  )}
            </button>
              </div>
          </div>
        </form>
        </>
      )}
    </div>
  );
};

export default EditMedicine; 