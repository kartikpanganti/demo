import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function EditMedicine() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    'Tablets',
    'Capsules',
    'Syrups',
    'Injections',
    'Ointments',
    'Drops',
    'Inhalers',
    'Patches',
    'Suppositories',
    'Solutions'
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
    'Tablets',
    'Capsules',
    'Bottles',
    'Tubes',
    'Pieces',
    'Strips',
    'Vials',
    'Ampoules',
    'ml',
    'mg',
    'g'
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

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/medicines/${id}`);
        const medicine = response.data;
        
        // Format dates for the form
        const formattedMedicine = {
          ...medicine,
          expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
          manufacturingDate: medicine.manufacturingDate ? new Date(medicine.manufacturingDate).toISOString().split('T')[0] : ''
        };
        
        // Set form data with the fetched medicine, ensuring all fields are present
        setFormData(prevState => ({
          ...prevState,
          ...formattedMedicine
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching medicine:', error);
        setError('Failed to fetch medicine details. Please try again.');
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

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
      await axios.put(`${API_BASE_URL}/api/medicines/${id}`, formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating medicine');
      setLoading(false);
    }
  };

  if (loading && !success) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-400 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Medicine Updated Successfully!</h2>
          <p className="text-green-600 mb-4">The medicine has been updated in the inventory.</p>
          <p className="text-gray-600">Redirecting to inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Medicine</h2>
        
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
                  className="input w-full"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Barcode cannot be edited</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="input w-full"
                  placeholder="e.g. 500mg, 10ml"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="e.g. 10 tablets, 100ml"
                />
              </div>
            </div>
          </div>

          {/* Inventory & Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Inventory & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock*</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="e.g. Shelf A, Cabinet 2"
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
                <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Stock*</label>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Side Effects</label>
                <textarea
                  name="sideEffects"
                  value={formData.sideEffects}
                  onChange={handleInputChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraindications</label>
                <textarea
                  name="contraindications"
                  value={formData.contraindications}
                  onChange={handleInputChange}
                  rows="2"
                  className="input w-full"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="prescriptionRequired"
                    type="checkbox"
                    name="prescriptionRequired"
                    checked={formData.prescriptionRequired}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="prescriptionRequired" className="ml-2 block text-sm text-gray-700">
                    Prescription Required
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="controlledSubstance"
                    type="checkbox"
                    name="controlledSubstance"
                    checked={formData.controlledSubstance}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="controlledSubstance" className="ml-2 block text-sm text-gray-700">
                    Controlled Substance
                  </label>
                </div>
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
                className="input w-full"
                placeholder="Any additional information about this medicine..."
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMedicine; 