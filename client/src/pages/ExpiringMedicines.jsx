import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ExpiringMedicines() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringMedicines = async () => {
      try {
        console.log('Fetching expiring medicines...');
        const response = await axios.get(`${API_BASE_URL}/api/medicines/expiring`);
        console.log('Expiring medicines data received:', response.data);
        setMedicines(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expiring medicines:', error);
        // Add more detailed error logging
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        }
        setLoading(false);
      }
    };

    fetchExpiringMedicines();
  }, []);

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30) {
      return {
        label: 'Expires in ' + daysUntilExpiry + ' days',
        className: 'bg-red-100 text-red-800'
      };
    } else if (daysUntilExpiry <= 60) {
      return {
        label: 'Expires in ' + daysUntilExpiry + ' days',
        className: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        label: 'Expires in ' + daysUntilExpiry + ' days',
        className: 'bg-green-100 text-green-800'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Expiring Medicines</h1>
      </div>

      {medicines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No medicines are expiring soon.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {medicines.map((medicine) => {
                const expiryStatus = getExpiryStatus(medicine.expiryDate);
                return (
                  <tr key={medicine._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                      <div className="text-sm text-gray-500">{medicine.manufacturer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medicine.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medicine.stock} {medicine.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(medicine.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expiryStatus.className}`}>
                        {expiryStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/edit/${medicine._id}`)}
                        className="text-primary hover:text-primary/80"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExpiringMedicines; 