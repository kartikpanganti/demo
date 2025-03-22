import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AlertConfigModal from '../components/AlertConfigModal';
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CogIcon
} from '@heroicons/react/24/outline';

function ExpiryTracker() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    expired: 0,
    critical: 0, // 0-7 days
    warning: 0,  // 8-30 days
    upcoming: 0, // 31-90 days
    safe: 0      // > 90 days
  });
  const [showStats, setShowStats] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    field: 'daysUntilExpiry',
    direction: 'asc'
  });
  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    search: ''
  });
  const [showActions, setShowActions] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Define timeframes in days
  const TIMEFRAMES = {
    expired: { label: 'Expired', min: null, max: 0, color: 'bg-red-100 text-red-800' },
    critical: { label: 'Critical (0-7 days)', min: 0, max: 7, color: 'bg-red-50 text-red-600' },
    warning: { label: 'Warning (8-30 days)', min: 8, max: 30, color: 'bg-yellow-50 text-yellow-600' },
    upcoming: { label: 'Upcoming (31-90 days)', min: 31, max: 90, color: 'bg-blue-50 text-blue-600' },
    safe: { label: 'Safe (>90 days)', min: 91, max: null, color: 'bg-green-50 text-green-600' },
    all: { label: 'All Medicines', min: null, max: null, color: 'bg-gray-50 text-gray-600' }
  };

  useEffect(() => {
    fetchMedicines();
  }, [selectedTimeframe, sortConfig, filters]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      
      // Construct the API query based on filters
      let endpoint = `${API_BASE_URL}/api/medicines/expiry`;
      
      // Add query parameters
      const params = {
        timeframe: selectedTimeframe !== 'all' ? selectedTimeframe : undefined,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        ...filters
      };

      const response = await axios.get(endpoint, { params });
      
      if (response.data) {
        setMedicines(response.data.medicines || []);
        setStats(response.data.stats || {
          expired: 0,
          critical: 0,
          warning: 0,
          upcoming: 0,
          safe: 0
        });
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    setSelectedMedicines([]);
  };

  const handleSortChange = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const toggleSelectAll = () => {
    if (selectedMedicines.length === medicines.length) {
      setSelectedMedicines([]);
    } else {
      setSelectedMedicines(medicines.map(med => med._id));
    }
  };

  const toggleSelectMedicine = (id) => {
    setSelectedMedicines(prev => 
      prev.includes(id) 
        ? prev.filter(medicineId => medicineId !== id) 
        : [...prev, id]
    );
  };

  const createExpiryAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/alerts/generate-expiry`, {
        medicineIds: selectedMedicines.length > 0 ? selectedMedicines : undefined
      });
      
      alert(`${response.data.created} expiry alerts generated successfully! (${response.data.skipped} skipped)`);
      setSelectedMedicines([]);
    } catch (error) {
      console.error('Error creating expiry alerts:', error);
      alert('Failed to create expiry alerts');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusClass = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return 'text-red-600 font-bold';
    if (daysUntilExpiry <= 7) return 'text-red-600';
    if (daysUntilExpiry <= 30) return 'text-yellow-600';
    if (daysUntilExpiry <= 90) return 'text-blue-600';
    return 'text-green-600';
  };

  const getExpiryBadgeClass = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return 'bg-red-100 text-red-800';
    if (daysUntilExpiry <= 7) return 'bg-red-50 text-red-600';
    if (daysUntilExpiry <= 30) return 'bg-yellow-50 text-yellow-600';
    if (daysUntilExpiry <= 90) return 'bg-blue-50 text-blue-600';
    return 'bg-green-50 text-green-600';
  };

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return 'Expired';
    if (daysUntilExpiry <= 7) return 'Critical';
    if (daysUntilExpiry <= 30) return 'Warning';
    if (daysUntilExpiry <= 90) return 'Upcoming';
    return 'Safe';
  };

  if (loading && medicines.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expiry Tracker</h1>
          <p className="text-gray-600 mt-1">
            Track and manage expiring medicines
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn btn-secondary flex items-center"
          >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className={`btn ${showActions ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            {showActions ? 'Hide Actions' : 'Show Actions'}
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <CogIcon className="w-5 h-5 mr-2" />
            Configure Alerts
          </button>
          <button
            onClick={fetchMedicines}
            className="btn btn-secondary flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div 
            className={`p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'all' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('all')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500">All Medicines</h3>
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.expired + stats.critical + stats.warning + stats.upcoming + stats.safe}
            </p>
          </div>
          
          <div 
            className={`bg-red-50 p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'expired' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('expired')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-red-700">Expired</h3>
              <XCircleIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-red-900">{stats.expired}</p>
          </div>
          
          <div 
            className={`bg-red-50 p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'critical' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('critical')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-red-700">Critical (0-7 days)</h3>
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-red-900">{stats.critical}</p>
          </div>
          
          <div 
            className={`bg-yellow-50 p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'warning' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('warning')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-yellow-700">Warning (8-30 days)</h3>
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-yellow-900">{stats.warning}</p>
          </div>
          
          <div 
            className={`bg-blue-50 p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'upcoming' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('upcoming')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-700">Upcoming (31-90 days)</h3>
              <CalendarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{stats.upcoming}</p>
          </div>
          
          <div 
            className={`bg-green-50 p-4 rounded-lg shadow cursor-pointer ${selectedTimeframe === 'safe' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleTimeframeChange('safe')}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-green-700">Safe (&gt;90 days)</h3>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="mt-1 text-2xl font-semibold text-green-900">{stats.safe}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search medicines by name or batch number..."
              className="input w-full"
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input w-full"
            >
              <option value="">All Categories</option>
              <option value="Tablets">Tablets</option>
              <option value="Capsules">Capsules</option>
              <option value="Syrups">Syrups</option>
              <option value="Injections">Injections</option>
              <option value="Ointments">Ointments</option>
            </select>
          </div>
          
          <div className="w-full md:w-1/4">
            <select
              value={filters.manufacturer}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
              className="input w-full"
            >
              <option value="">All Manufacturers</option>
              {/* Dynamic options would be populated from unique manufacturers */}
              <option value="AstraZeneca">AstraZeneca</option>
              <option value="Pfizer">Pfizer</option>
              <option value="Bayer">Bayer</option>
              <option value="Cipla">Cipla</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showActions && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span className="text-blue-700">
            {selectedMedicines.length} medicines selected
          </span>
          <div className="flex space-x-4">
            <button
              onClick={toggleSelectAll}
              className="btn btn-secondary flex items-center"
              disabled={medicines.length === 0}
            >
              {selectedMedicines.length === medicines.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={createExpiryAlerts}
              className="btn btn-primary flex items-center"
              disabled={selectedMedicines.length === 0}
            >
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              Create Expiry Alerts
            </button>
          </div>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showActions && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMedicines.length === medicines.length && medicines.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                      disabled={medicines.length === 0}
                    />
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  Name
                  {sortConfig.field === 'name' && (
                    <ArrowsUpDownIcon className="w-4 h-4 inline ml-1" />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('expiryDate')}
                >
                  Expiry Date
                  {sortConfig.field === 'expiryDate' && (
                    <ArrowsUpDownIcon className="w-4 h-4 inline ml-1" />
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('daysUntilExpiry')}
                >
                  Days Until Expiry
                  {sortConfig.field === 'daysUntilExpiry' && (
                    <ArrowsUpDownIcon className="w-4 h-4 inline ml-1" />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicines.length > 0 ? (
                medicines.map((medicine) => {
                  const daysUntilExpiry = calculateDaysUntilExpiry(medicine.expiryDate);
                  return (
                    <tr key={medicine._id} className="hover:bg-gray-50">
                      {showActions && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedMedicines.includes(medicine._id)}
                            onChange={() => toggleSelectMedicine(medicine._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                        <div className="text-xs text-gray-500">{medicine.manufacturer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {medicine.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicine.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {medicine.stock} {medicine.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${getExpiryStatusClass(daysUntilExpiry)}`}>
                          {new Date(medicine.expiryDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getExpiryStatusClass(daysUntilExpiry)}`}>
                          {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getExpiryBadgeClass(daysUntilExpiry)}`}>
                          {getExpiryStatus(daysUntilExpiry)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/show/${medicine._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <EyeIcon className="w-5 h-5 inline" />
                        </Link>
                        {daysUntilExpiry <= 30 && (
                          <button
                            onClick={() => {
                              toggleSelectMedicine(medicine._id);
                              createExpiryAlerts();
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Create expiry alert for this medicine"
                          >
                            <ExclamationTriangleIcon className="w-5 h-5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showActions ? 9 : 8} className="px-6 py-10 text-center text-gray-500">
                    No medicines found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Configuration Modal */}
      <AlertConfigModal 
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={(config) => {
          console.log('Alert config updated:', config);
          fetchMedicines(); // Refresh data after config changes
        }}
      />
    </div>
  );
}

export default ExpiryTracker; 