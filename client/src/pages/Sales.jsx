import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  ArrowDownTrayIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [paymentFilter, setPaymentFilter] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    avgSaleValue: 0,
    paymentMethods: [],
    topProducts: []
  });
  const [timeFrame, setTimeFrame] = useState('today');
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [currentPage, searchQuery, dateRange, paymentFilter, timeFrame]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/sales`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
          paymentMethod: paymentFilter || undefined
        }
      });
      setSales(response.data.sales);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get(`${API_BASE_URL}/api/sales/stats`, {
        params: { timeFrame }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSales();
  };

  const handleTimeFrameChange = (newTimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchSales()}
            className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
              Sales Overview
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleTimeFrameChange('today')}
                className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Today
              </button>
              <button 
                onClick={() => handleTimeFrameChange('week')}
                className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Week
              </button>
              <button 
                onClick={() => handleTimeFrameChange('month')}
                className={`px-3 py-1 text-sm rounded-md ${timeFrame === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loadingStats ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-600 mb-1">Total Sales</div>
                <div className="text-2xl font-bold">{stats.totalSales}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600 mb-1">Revenue</div>
                <div className="text-2xl font-bold">${stats.totalAmount?.toFixed(2) || 0}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-600 mb-1">Average Sale</div>
                <div className="text-2xl font-bold">${stats.avgSaleValue?.toFixed(2) || 0}</div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Payment Methods</h3>
                <div className="space-y-2">
                  {stats.paymentMethods?.map(method => (
                    <div key={method._id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          method._id === 'Cash' ? 'bg-green-500' : 
                          method._id === 'Card' ? 'bg-blue-500' : 
                          method._id === 'UPI' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                        <span>{method._id}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{method.count} sales</span>
                        <span className="font-medium">${method.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {(!stats.paymentMethods || stats.paymentMethods.length === 0) && (
                    <div className="text-gray-500 text-sm">No payment data available</div>
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Top Products</h3>
                <div className="space-y-2">
                  {stats.topProducts?.map((product, index) => (
                    <div key={product._id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-5 text-center font-medium text-gray-500 mr-2">{index + 1}</div>
                        <span className="truncate">{product.name}</span>
                      </div>
                      <span className="font-medium">{product.totalQuantity} units</span>
                    </div>
                  ))}
                  {(!stats.topProducts || stats.topProducts.length === 0) && (
                    <div className="text-gray-500 text-sm">No product data available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Sales</h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Invoice or customer..."
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full pl-10 p-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full pl-10 p-2 border rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No sales found matching your criteria
                  </td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.customer?.name || 'Walk-in Customer'}
                      {sale.customer?.contact && (
                        <div className="text-xs text-gray-500">{sale.customer.contact}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 
                        sale.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' : 
                        sale.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales; 