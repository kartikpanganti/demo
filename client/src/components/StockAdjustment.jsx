import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BarcodeScanner from './BarcodeScanner';

function StockAdjustment() {
  const [showScanner, setShowScanner] = useState(false);
  const [medicine, setMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleScan = async (barcode) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/medicines/barcode/${barcode}`);
      setMedicine(response.data);
      setShowScanner(false);
    } catch (error) {
      setError('Medicine not found with this barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicine) return;

    try {
      setLoading(true);
      setError(null);
      const adjustedQuantity = adjustmentType === 'increase' ? quantity : -quantity;
      
      await axios.put(`${API_BASE_URL}/api/medicines/${medicine._id}/stock`, {
        adjustment: adjustedQuantity
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setMedicine(null);
      setQuantity(1);
    } catch (error) {
      setError(error.response?.data?.message || 'Error adjusting stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Stock Adjustment</h2>

      <button
        onClick={() => setShowScanner(true)}
        className="btn btn-primary w-full mb-4"
      >
        Scan Barcode
      </button>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Stock adjusted successfully!
        </div>
      )}

      {medicine && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg">{medicine.name}</h3>
            <p className="text-gray-600">Current Stock: {medicine.stock} {medicine.unit}</p>
            <p className="text-gray-600">Barcode: {medicine.barcode}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="input w-full"
              required
            >
              <option value="increase">Increase Stock</option>
              <option value="decrease">Decrease Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="input w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Adjusting...' : 'Adjust Stock'}
          </button>
        </form>
      )}
    </div>
  );
}

export default StockAdjustment; 