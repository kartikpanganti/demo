import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  TrashIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon, 
  AdjustmentsHorizontalIcon, ChartBarIcon, ExclamationTriangleIcon,
  PlusIcon, MinusIcon, ArrowDownTrayIcon, EyeIcon,
  ChevronDoubleLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import MedicineDetailsModal from '../components/MedicineDetailsModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [visiblePages, setVisiblePages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    categoryDistribution: {}
  });
  const [quickAdjust, setQuickAdjust] = useState({ id: null, amount: 0 });
  const [filters, setFilters] = useState({
    category: '',
    stock: 'all',
    expiry: 'all',
    manufacturer: '',
    priceRange: { min: '', max: '' }
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'name',
    direction: 'asc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);

  // Delete confirmation modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchMedicines();
    if (showStats) {
      fetchStats();
    }
  }, [currentPage, pageSize, searchQuery, filters, sortConfig, showStats]);

  useEffect(() => {
    // Calculate visible page numbers
    const calculateVisiblePages = () => {
      const delta = 2; // Number of pages to show before and after current page
      const range = [];
      const rangeWithDots = [];
      let l;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      range.forEach(i => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      setVisiblePages(rangeWithDots);
    };

    calculateVisiblePages();
  }, [currentPage, totalPages]);

  const fetchStats = async () => {
    try {
      setConnectionError(false);
      const response = await axios.get(`${API_BASE_URL}/api/medicines/stats`);
      setStats({
        ...response.data,
        totalValue: Number(response.data.totalValue || 0),
        lowStockCount: Number(response.data.lowStockCount || 0),
        expiringCount: Number(response.data.expiringCount || 0),
        expiredCount: Number(response.data.expiredCount || 0),
        totalMedicines: Number(response.data.totalMedicines || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.code === 'ERR_NETWORK') {
        setConnectionError(true);
      }
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      const response = await axios.get(`${API_BASE_URL}/api/medicines`, {
        params: {
          page: currentPage,
          limit: pageSize,
          search: searchQuery,
          ...filters,
          sortField: sortConfig.field,
          sortDirection: sortConfig.direction
        }
      });
      setMedicines(response.data.medicines);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      if (error.code === 'ERR_NETWORK') {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (medicine) => {
    setMedicineToDelete(medicine);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedMedicines.length === 0) return;
    setBulkDeleteModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/medicines/${id}`);
      fetchMedicines();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Error deleting medicine. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedMedicines.map(id => 
        axios.delete(`${API_BASE_URL}/api/medicines/${id}`)
      ));
      setSelectedMedicines([]);
      fetchMedicines();
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      alert('Error deleting medicines. Please try again.');
    }
  };

  const handleQuickStockAdjust = async (id, amount) => {
    try {
      await axios.put(`${API_BASE_URL}/api/medicines/${id}/stock`, { adjustment: amount });
      fetchMedicines();
      setQuickAdjust({ id: null, amount: 0 });
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock. Please try again.');
    }
  };

  const exportToCSV = async () => {
    try {
      // Fetch all medicines without pagination and request all fields
      const response = await axios.get(`${API_BASE_URL}/api/medicines/export`, {
        params: {
          search: searchQuery,
          ...filters,
          sortField: sortConfig.field,
          sortDirection: sortConfig.direction
        }
      });

      const allMedicines = response.data.medicines;

      // Define all possible fields to export
      const selectedFields = [
        { key: 'name', label: 'Name' },
        { key: 'genericName', label: 'Generic Name' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'dosageForm', label: 'Dosage Form' },
        { key: 'strength', label: 'Strength' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'stock', label: 'Current Stock' },
        { key: 'unit', label: 'Unit' },
        { key: 'minimumStock', label: 'Minimum Stock' },
        { key: 'price', label: 'Price' },
        { key: 'expiryDate', label: 'Expiry Date' },
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'location', label: 'Location' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'reorderLevel', label: 'Reorder Level' },
        { key: 'notes', label: 'Notes' }
      ];

      // Create CSV header
      const headers = selectedFields.map(field => field.label);

      // Create CSV rows with proper value handling
      const rows = allMedicines.map(medicine => 
        selectedFields.map(field => {
          const value = medicine[field.key];
          
          // Handle different types of values
          if (value === null || value === undefined) {
            return '';
          }
          
          if (field.key === 'expiryDate') {
            return new Date(value).toLocaleDateString();
          }
          
          if (field.key === 'price') {
            return `$${Number(value).toFixed(2)}`;
          }
          
          if (typeof value === 'string' && value.includes(',')) {
            // Escape strings containing commas
            return `"${value}"`;
          }
          
          return value.toString();
        })
      );

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download file with BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = URL.createObjectURL(blob);
      link.download = `pharmacy_inventory_${timestamp}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpIcon className="w-4 h-4 inline ml-1" /> :
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const toggleSelectAll = () => {
    if (selectedMedicines.length === medicines.length) {
      setSelectedMedicines([]);
    } else {
      setSelectedMedicines(medicines.map(m => m._id));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePageClick = (page) => {
    if (page === '...') return;
    setCurrentPage(page);
  };

  const openMedicineModal = (medicineId) => {
    setSelectedMedicineId(medicineId);
    setModalOpen(true);
  };

  const closeMedicineModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedMedicineId(null);
    }, 300);
  };

  const handleDeleteConfirm = () => {
    if (medicineToDelete) {
      handleDelete(medicineToDelete._id);
      setDeleteModalOpen(false);
      setMedicineToDelete(null);
    }
  };

  const handleBulkDeleteConfirm = () => {
    handleBulkDelete();
    setBulkDeleteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {connectionError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <h3 className="font-bold">Connection Error</h3>
          <p>Unable to connect to the server at {API_BASE_URL}. Please ensure the server is running.</p>
          <button 
            onClick={() => {
              fetchMedicines();
              if (showStats) fetchStats();
            }} 
            className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-gray-600 mt-1">
            {totalItems} medicines found
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
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <Link to="/add" className="btn btn-primary flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Medicine
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Medicines</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalMedicines || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ${(stats.totalValue || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-yellow-700">Low Stock</h3>
              <p className="mt-1 text-2xl font-semibold text-yellow-900">
                {stats.lowStockCount || 0}
              </p>
              <Link to="/low-stock" className="text-xs text-yellow-600 hover:underline">
                View Details →
              </Link>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-orange-700">Expiring Soon</h3>
              <p className="mt-1 text-2xl font-semibold text-orange-900">
                {stats.expiringCount || 0}
              </p>
              <Link to="/expiring" className="text-xs text-orange-600 hover:underline">
                View Details →
              </Link>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-red-700">Expired</h3>
              <p className="mt-1 text-2xl font-semibold text-red-900">
                {stats.expiredCount || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-blue-700">Categories</h3>
              <p className="mt-1 text-2xl font-semibold text-blue-900">
                {Object.keys(stats.categoryDistribution || {}).length}
              </p>
              <Link to="/" className="text-xs text-blue-600 hover:underline">
                View Dashboard →
              </Link>
            </div>
          </div>

          {/* Category Distribution */}
          {Object.keys(stats.categoryDistribution || {}).length > 0 && (
            <div className="mt-4 bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Category Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-sm font-medium text-gray-500">{category}</div>
                    <div className="text-lg font-semibold text-gray-900">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search medicines by name, category, or manufacturer..."
              className="input w-full"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="btn btn-secondary flex items-center"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input w-full"
              >
                <option value="">All Categories</option>
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                value={filters.stock}
                onChange={(e) => handleFilterChange('stock', e.target.value)}
                className="input w-full"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Status</label>
              <select
                value={filters.expiry}
                onChange={(e) => handleFilterChange('expiry', e.target.value)}
                className="input w-full"
              >
                <option value="all">All</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={filters.manufacturer}
                onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                placeholder="Filter by manufacturer"
                className="input w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
                  placeholder="Min price"
                  className="input w-full"
                />
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
                  placeholder="Max price"
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedMedicines.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span className="text-blue-700">
            {selectedMedicines.length} medicines selected
          </span>
          <div className="flex space-x-4">
            <button
              onClick={confirmBulkDelete}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                text-white bg-red-600 border border-red-700 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={loading || selectedMedicines.length === 0}
            >
              <TrashIcon className="w-4 h-4 mr-1.5" />
              Delete Selected
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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMedicines.length === medicines.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIcon('name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  Category {renderSortIcon('category')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  Stock {renderSortIcon('stock')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  Price {renderSortIcon('price')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('expiryDate')}
                >
                  Expiry Date {renderSortIcon('expiryDate')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicines.map((medicine) => (
                <tr key={medicine._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedMedicines.includes(medicine._id)}
                      onChange={() => {
                        setSelectedMedicines(prev => 
                          prev.includes(medicine._id)
                            ? prev.filter(id => id !== medicine._id)
                            : [...prev, medicine._id]
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{medicine.name || 'Unnamed'}</div>
                    <div className="text-sm text-gray-500">{medicine.manufacturer || 'No manufacturer'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {medicine.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-medium ${
                        (medicine.stock !== undefined && medicine.minimumStock !== undefined && 
                        medicine.stock <= medicine.minimumStock)
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {medicine.stock || 0} {medicine.unit || 'units'}
                      </div>
                      {quickAdjust.id === medicine._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={quickAdjust.amount}
                            onChange={(e) => setQuickAdjust(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
                            className="w-20 input"
                          />
                          <button
                            onClick={() => handleQuickStockAdjust(medicine._id, quickAdjust.amount)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAdjust({ id: medicine._id, amount: 0 })}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                    {medicine.stock !== undefined && medicine.minimumStock !== undefined && 
                     medicine.stock <= medicine.minimumStock && (
                      <div className="text-xs text-red-500 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        Low Stock
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(medicine.price !== undefined && medicine.price !== null) ? 
                      Number(medicine.price).toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      medicine.expiryDate && new Date(medicine.expiryDate) <= new Date()
                        ? 'text-red-600'
                        : medicine.expiryDate && new Date(medicine.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-yellow-600'
                        : 'text-gray-900'
                    }`}>
                      {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : 'No expiry date'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openMedicineModal(medicine._id)}
                      className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <Link
                      to={`/edit/${medicine._id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => confirmDelete(medicine)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete medicine"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Show message if no medicines found */}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    {connectionError 
                      ? 'Unable to connect to the server. Please check your connection and try again.'
                      : 'No medicines found. Add some medicines to get started!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Updated Pagination Section */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {((currentPage - 1) * pageSize) + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{totalItems}</span>
              {' '}results
            </span>
            
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="input input-sm"
            >
              {[5, 10, 25, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center flex-1">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">First</span>
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {visiblePages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => handlePageClick(page)}
                  disabled={page === '...'}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : page === '...'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                <span className="sr-only">Last</span>
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Medicine Details Modal */}
      <MedicineDetailsModal 
        isOpen={modalOpen}
        onClose={closeMedicineModal}
        medicineId={selectedMedicineId}
      />

      {/* Delete Confirmation Modal for single medicine */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medicine"
        message={medicineToDelete ? `Are you sure you want to delete ${medicineToDelete.name}? This action cannot be undone.` : 'Are you sure you want to delete this medicine?'}
      />
      
      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Medicines"
        message={`Are you sure you want to delete ${selectedMedicines.length} selected medicines? This action cannot be undone.`}
      />
    </div>
  );
}

export default Inventory; 