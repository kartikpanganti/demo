import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import SaleDetailsModal from '../components/SaleDetailsModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';

function SalesHistory() {
  // State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
  });
  const [stats, setStats] = useState({
    totalAmount: 0,
    avgSaleValue: 0,
    totalItems: 0
  });

  // Fetch sales data
  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [currentPage, filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
      };

      // Add filter parameters if they exist
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const response = await axios.get(`${API_BASE_URL}/api/sales`, { params });
      
      setSales(response.data.sales);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setTotalSales(response.data.totalSales);
      
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Build query parameters based on current filters
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;

      const response = await axios.get(`${API_BASE_URL}/api/sales/stats`, { params });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchSales();
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const changePage = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleSaleUpdate = (updatedSale) => {
    // Update the sale in the list
    setSales(sales.map(sale => 
      sale._id === updatedSale._id ? updatedSale : sale
    ));
  };

  const handleSaleDelete = (saleId) => {
    // Remove the sale from the list
    setSales(sales.filter(sale => sale._id !== saleId));
    // Refresh data to get updated stats and pagination
    fetchSales();
    fetchStats();
  };

  const exportToExcel = () => {
    try {
      // Create a worksheet from the sales data
      const worksheet = XLSX.utils.json_to_sheet(sales.map(sale => ({
        'Invoice Number': sale.invoiceNumber,
        'Date': new Date(sale.createdAt).toLocaleString(),
        'Customer': sale.customer.name,
        'Contact': sale.customer.contact,
        'Items': sale.items.length,
        'Payment Method': sale.paymentMethod,
        'Subtotal': sale.subTotal.toFixed(2),
        'Tax': sale.tax.toFixed(2),
        'Discount': sale.discount.toFixed(2),
        'Total': sale.total.toFixed(2)
      })));
      
      // Create a workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
      
      // Generate file name with current date
      const fileName = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write the workbook and download
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Sales History</h1>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => fetchSales()}
            className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 hover:bg-green-100"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-blue-100">
          <div className="text-sm font-medium text-blue-600 mb-1">Total Sales</div>
          <div className="text-2xl font-bold">{totalSales}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-green-100">
          <div className="text-sm font-medium text-green-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold">${stats.totalAmount?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-purple-100">
          <div className="text-sm font-medium text-purple-600 mb-1">Average Sale</div>
          <div className="text-2xl font-bold">${stats.avgSaleValue?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-orange-100">
          <div className="text-sm font-medium text-orange-600 mb-1">Items Sold</div>
          <div className="text-2xl font-bold">{stats.totalItems || 0}</div>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center mb-4">
          {/* Search */}
          <div className="flex-1 mb-4 md:mb-0 md:mr-4">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice #, customer name or contact"
                className="flex-1 p-2 border rounded-l"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
          
          {/* Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded border ${
              showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Filter Sales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  className="w-full p-2 border rounded"
                  placeholderText="From Date"
                  maxDate={filters.endDate || new Date()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  className="w-full p-2 border rounded"
                  placeholderText="To Date"
                  minDate={filters.startDate}
                  maxDate={new Date()}
                />
              </div>
              
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="Min Amount"
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="Max Amount"
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
              <button
                onClick={() => { setCurrentPage(1); fetchSales(); }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2 text-gray-500">Loading sales data...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    No sales found matching your criteria
                  </td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(sale.createdAt)}</div>
                      <div className="text-xs text-gray-500">{formatTime(sale.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.customer.name}</div>
                      <div className="text-xs text-gray-500">{sale.customer.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.items.length} item(s)</div>
                      <div className="text-xs text-gray-500">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                        sale.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
                        sale.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">${sale.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => viewSaleDetails(sale)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{sales.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalSales)}
                </span>{' '}
                of <span className="font-medium">{totalSales}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 ${
                    currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Show current page, and 2 pages on either side if they exist
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => changePage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === pageNumber
                            ? 'bg-blue-500 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === currentPage - 3 && currentPage > 4) ||
                    (pageNumber === currentPage + 3 && currentPage < totalPages - 3)
                  ) {
                    // Show ellipsis
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 ${
                    currentPage === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onUpdate={handleSaleUpdate}
          onDelete={handleSaleDelete}
        />
      )}
    </div>
  );
}

export default SalesHistory; 