import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AddMedicine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState('');

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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Medicine</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Generic Name*</label>
                <input
                  type="text"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category*</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Therapeutic Category*</label>
                <select
                  name="therapeuticCategory"
                  value={formData.therapeuticCategory}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                >
                  <option value="">Select Therapeutic Category</option>
                  {therapeuticCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Manufacturer & Supply Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Manufacturer & Supply</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer*</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number*</label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Leave empty for auto-generation"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage Form*</label>
                <select
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                >
                  <option value="">Select Dosage Form</option>
                  {dosageForms.map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Strength</label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleInputChange}
                  placeholder="e.g., 500mg, 50ml"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  placeholder="e.g., 10 tablets per strip"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit*</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                >
                  <option value="">Select Unit</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stock & Price Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Stock & Price</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Stock*</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Stock Level*</label>
                <input
                  type="number"
                  name="minimumStock"
                  value={formData.minimumStock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price*</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price*</label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  min="0"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Shelf A-1"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                <input
                  type="date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date*</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Medical Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Side Effects</label>
                <textarea
                  name="sideEffects"
                  value={formData.sideEffects}
                  onChange={handleInputChange}
                  rows="3"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraindications</label>
                <textarea
                  name="contraindications"
                  value={formData.contraindications}
                  onChange={handleInputChange}
                  rows="3"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Storage Instructions</label>
                <textarea
                  name="storageInstructions"
                  value={formData.storageInstructions}
                  onChange={handleInputChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Instructions</label>
                <textarea
                  name="usageInstructions"
                  value={formData.usageInstructions}
                  onChange={handleInputChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="prescriptionRequired"
                  checked={formData.prescriptionRequired}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Prescription Required</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="controlledSubstance"
                  checked={formData.controlledSubstance}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Controlled Substance</label>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Notes</h3>
            <div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any additional notes or remarks"
                className="input w-full"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicine; 