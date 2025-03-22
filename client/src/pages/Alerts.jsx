import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BellIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    info: 0
  });
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all'
  });
  const [showStats, setShowStats] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    
    // Set up polling for real-time updates if autoRefresh is enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAlerts(false); // Don't show loading state for auto-refreshes
        fetchStats();
        setLastUpdated(new Date());
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filters, autoRefresh]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/alerts/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      setError('Error fetching statistics. Please try again.');
    }
  };

  const fetchAlerts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      
      console.log('Fetching alerts with filters:', filters);
      const response = await axios.get(`${API_BASE_URL}/api/alerts`, {
        params: filters
      });
      
      console.log('Alerts response:', response.data);
      
      if (Array.isArray(response.data)) {
        // Ensure all alerts have required fields
        const processedAlerts = response.data.map(alert => ({
          ...alert,
          _id: alert._id || alert.id, // Ensure we have an _id field
          title: alert.title || 'Untitled Alert',
          message: alert.message || 'No message provided',
          priority: alert.priority || 'info',
          status: alert.status || 'new',
          read: typeof alert.read === 'boolean' ? alert.read : false,
          type: alert.type || 'unknown',
          createdAt: alert.createdAt || new Date().toISOString()
        }));
        
        setAlerts(processedAlerts);
      } else {
        console.error('Expected array of alerts but got:', response.data);
        setAlerts([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setError(`Server error: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        console.error('Request error:', error.request);
        setError('Network error: Could not connect to server');
      } else {
        setError(`Error: ${error.message}`);
      }
      setAlerts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const markAsRead = async (alertId) => {
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      console.log('Marking alert as read:', alertId);
      
      const response = await axios.put(`${API_BASE_URL}/api/alerts/${alertId}/read`);
      console.log('Mark as read response:', response.data);
      
      setStatusMessage('Alert marked as read');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      if (error.response) {
        setError(`Error: ${error.response.data.message || 'Failed to mark as read'}`);
      } else {
        setError('Network error: Could not mark alert as read');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      console.log('Resolving alert:', alertId);
      
      const response = await axios.put(`${API_BASE_URL}/api/alerts/${alertId}/resolve`);
      console.log('Resolve alert response:', response.data);
      
      setStatusMessage('Alert resolved successfully');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error resolving alert:', error);
      if (error.response) {
        setError(`Error: ${error.response.data.message || 'Failed to resolve alert'}`);
      } else {
        setError('Network error: Could not resolve alert');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewMedicine = (medicineId) => {
    if (!medicineId) {
      setError('Medicine ID not available for this alert');
      return;
    }
    
    console.log('Navigating to medicine details:', medicineId);
    navigate(`/show/${medicineId}`);
  };

  const createTestAlert = async () => {
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      
      const response = await axios.post(`${API_BASE_URL}/api/alerts/test-info`);
      console.log('Create test alert response:', response.data);
      
      setStatusMessage('Test alert created successfully');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error creating test alert:', error);
      if (error.response) {
        setError(`Error: ${error.response.data.message || 'Failed to create test alert'}`);
      } else {
        setError('Network error: Could not create test alert');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <BellIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Resolved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            New
          </span>
        );
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-gray-600 mt-1">
            Manage your inventory alerts and notifications
            {lastUpdated && 
              <span className="text-xs ml-2 text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            }
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
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center`}
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
          <button
            onClick={() => fetchAlerts()}
            className="btn btn-primary flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
          <button
            onClick={createTestAlert}
            className="btn btn-info flex items-center"
            disabled={actionLoading}
          >
            <BellIcon className="w-5 h-5 mr-2" />
            Create Test Alert
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Alerts</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-blue-700">Unread</h3>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{stats.unread}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-red-700">Critical</h3>
            <p className="mt-1 text-2xl font-semibold text-red-900">{stats.critical}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-yellow-700">Warnings</h3>
            <p className="mt-1 text-2xl font-semibold text-yellow-900">{stats.warning}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-green-700">Info</h3>
            <p className="mt-1 text-2xl font-semibold text-green-900">{stats.info}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="input input-sm"
          >
            <option value="all">All Types</option>
            <option value="low_stock">Low Stock</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="reorder">Reorder/Info</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="input input-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input input-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {(loading && alerts.length > 0) || actionLoading ? (
        <div className="absolute top-4 right-4 animate-pulse">
          <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
            {actionLoading ? 'Processing...' : 'Refreshing...'}
          </div>
        </div>
      ) : null}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert._id}
            className={`border rounded-lg p-4 ${getPriorityColor(alert.priority)} ${
              !alert.read ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getPriorityIcon(alert.priority)}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                    {getStatusBadge(alert.status)}
                    {alert.type && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {alert.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {alert.medicineId && (
                  <button
                    onClick={() => handleViewMedicine(
                      typeof alert.medicineId === 'object' ? alert.medicineId._id : alert.medicineId
                    )}
                    className="btn btn-sm btn-secondary flex items-center"
                    disabled={actionLoading}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </button>
                )}
                {!alert.read && (
                  <button
                    onClick={() => markAsRead(alert._id)}
                    className="btn btn-sm btn-secondary flex items-center"
                    disabled={actionLoading}
                  >
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Mark as Read
                  </button>
                )}
                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => resolveAlert(alert._id)}
                    className="btn btn-sm btn-primary flex items-center"
                    disabled={actionLoading}
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no alerts matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Alerts; 