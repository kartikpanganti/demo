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
  ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import MedicineDetailsModal from '../components/MedicineDetailsModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, isActive: false });
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

  // Medicine Details Modal state
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);

  // Delete Confirmation Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

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

  const deleteAlert = async (alertId) => {
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      console.log('Deleting alert:', alertId);
      
      await makeRequestWithRetry(`${API_BASE_URL}/api/alerts/${alertId}`, 'delete');
      
      setStatusMessage('Alert deleted successfully');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting alert:', error);
      if (error.response) {
        setError(`Error: ${error.response.data?.message || 'Failed to delete alert'}`);
      } else {
        setError('Network error: Could not delete alert');
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
    
    console.log('Opening medicine details modal for:', medicineId);
    setSelectedMedicineId(medicineId);
    setMedicineModalOpen(true);
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
        return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 shadow-sm border border-green-200">
            Resolved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 shadow-sm border border-yellow-200">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 shadow-sm border border-gray-200">
            New
          </span>
        );
    }
  };

  // Helper function to make API requests with retry logic
  const makeRequestWithRetry = async (url, method = 'get', data = null, retries = 2) => {
    try {
      const config = {
        url,
        method,
        data
      };
      
      return await axios(config);
    } catch (error) {
      if (retries === 0) {
        throw error;
      }
      
      console.log(`Request to ${url} failed. Retrying... (${retries} attempts left)`);
      // Wait before retrying (exponential backoff)
      const delay = 1000 * (3 - retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(url, method, data, retries - 1);
    }
  };

  // Helper function to process alerts in batches
  const processBatch = async (alerts, actionType) => {
    const batchSize = 5; // Process 5 alerts at a time
    let successCount = 0;
    let failedAlerts = [];
    
    // Set up progress tracking
    setBatchProgress({ current: 0, total: alerts.length, isActive: true });
    
    // Process in batches
    for (let i = 0; i < alerts.length; i += batchSize) {
      const batch = alerts.slice(i, i + batchSize);
      
      // Process current batch with a small delay between each request to avoid rate limiting
      for (let j = 0; j < batch.length; j++) {
        const alert = batch[j];
        try {
          // Determine URL based on action type
          const url = `${API_BASE_URL}/api/alerts/${alert._id}/${actionType}`;
          
          // Make request with retry logic
          await makeRequestWithRetry(url, 'put');
          successCount++;
          
          // Update progress after each successful request
          setBatchProgress(prev => ({ 
            ...prev, 
            current: Math.min(i + j + 1, alerts.length)
          }));
          
          // Small delay between individual requests to avoid rate limiting
          if (j < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Failed to process alert ${alert._id}:`, error);
          failedAlerts.push(alert.title || 'Unnamed alert');
          
          // Update progress even for failed requests
          setBatchProgress(prev => ({ 
            ...prev, 
            current: Math.min(i + j + 1, alerts.length)
          }));
        }
      }
      
      // Larger delay between batches
      if (i + batchSize < alerts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Reset progress
    setBatchProgress({ current: 0, total: 0, isActive: false });
    
    return { successCount, failedAlerts };
  };

  const markAllAsRead = async () => {
    if (alerts.length === 0 || !window.confirm('Mark all visible alerts as read?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      
      // Get only unread alerts
      const unreadAlerts = alerts.filter(alert => !alert.read);
      if (unreadAlerts.length === 0) {
        setStatusMessage('No unread alerts to mark as read.');
        setActionLoading(false);
        return;
      }
      
      if (unreadAlerts.length <= 3) {
        // For very small number of alerts, try simple sequential processing
        let successCount = 0;
        let failedAlerts = [];
        
        for (const alert of unreadAlerts) {
          try {
            await makeRequestWithRetry(
              `${API_BASE_URL}/api/alerts/${alert._id}/read`, 
              'put'
            );
            successCount++;
          } catch (err) {
            console.error(`Failed to mark alert ${alert._id} as read:`, err);
            failedAlerts.push(alert.title || 'Unnamed alert');
          }
        }
        
        if (successCount > 0) {
          setStatusMessage(`Successfully marked ${successCount} of ${unreadAlerts.length} alert(s) as read`);
        }
        
        if (failedAlerts.length > 0) {
          setError(`Failed to mark ${failedAlerts.length} alert(s) as read. Server may be overloaded. Please try again later.`);
        }
      } else {
        // For larger number of alerts, use batch processing
        console.log(`Processing ${unreadAlerts.length} alerts in batches...`);
        const { successCount, failedAlerts } = await processBatch(unreadAlerts, 'read');
        
        if (successCount > 0) {
          setStatusMessage(`Successfully marked ${successCount} of ${unreadAlerts.length} alert(s) as read`);
        }
        
        if (failedAlerts.length > 0) {
          setError(`Failed to mark ${failedAlerts.length} alert(s) as read. You can try again later for the remaining ones.`);
        }
      }
      
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      setError('Failed to process alerts. Please try again or contact support if the issue persists.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const markAllAsResolved = async () => {
    if (alerts.length === 0 || !window.confirm('Resolve all visible alerts? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      
      // Get only unresolved alerts
      const unresolvedAlerts = alerts.filter(alert => alert.status !== 'resolved');
      if (unresolvedAlerts.length === 0) {
        setStatusMessage('No unresolved alerts to resolve.');
        setActionLoading(false);
        return;
      }
      
      if (unresolvedAlerts.length <= 3) {
        // For very small number of alerts, try simple sequential processing
        let successCount = 0;
        let failedAlerts = [];
        
        for (const alert of unresolvedAlerts) {
          try {
            await makeRequestWithRetry(
              `${API_BASE_URL}/api/alerts/${alert._id}/resolve`, 
              'put'
            );
            successCount++;
          } catch (err) {
            console.error(`Failed to resolve alert ${alert._id}:`, err);
            failedAlerts.push(alert.title || 'Unnamed alert');
          }
        }
        
        if (successCount > 0) {
          setStatusMessage(`Successfully resolved ${successCount} of ${unresolvedAlerts.length} alert(s)`);
        }
        
        if (failedAlerts.length > 0) {
          setError(`Failed to resolve ${failedAlerts.length} alert(s). Server may be overloaded. Please try again later.`);
        }
      } else {
        // For larger number of alerts, use batch processing
        console.log(`Processing ${unresolvedAlerts.length} alerts in batches...`);
        const { successCount, failedAlerts } = await processBatch(unresolvedAlerts, 'resolve');
        
        if (successCount > 0) {
          setStatusMessage(`Successfully resolved ${successCount} of ${unresolvedAlerts.length} alert(s)`);
        }
        
        if (failedAlerts.length > 0) {
          setError(`Failed to resolve ${failedAlerts.length} alert(s). You can try again later for the remaining ones.`);
        }
      }
      
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error in markAllAsResolved:', error);
      setError('Failed to process alerts. Please try again or contact support if the issue persists.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation modal for a single alert
  const confirmDeleteAlert = (alert) => {
    setAlertToDelete(alert);
    setDeleteModalOpen(true);
  };
  
  // Handle confirmation from delete modal
  const handleDeleteConfirm = () => {
    if (alertToDelete) {
      deleteAlert(alertToDelete._id);
      setDeleteModalOpen(false);
      setAlertToDelete(null);
    }
  };
  
  // Open bulk delete confirmation modal
  const confirmDeleteAllAlerts = () => {
    setBulkDeleteModalOpen(true);
  };
  
  // Existing deleteAllAlerts function, modified to not show confirmation
  const deleteAllAlerts = async () => {
    try {
      setActionLoading(true);
      setError('');
      setStatusMessage('');
      console.log('Deleting all visible alerts');
      
      // Get IDs of visible alerts based on current filters
      const alertsToDelete = alerts
        .filter(alert => {
          if (filters.type !== 'all' && alert.type !== filters.type) return false;
          if (filters.priority !== 'all' && alert.priority !== filters.priority) return false;
          if (filters.status !== 'all' && alert.status !== filters.status) return false;
          return true;
        })
        .map(alert => alert._id);
      
      if (alertsToDelete.length === 0) {
        setStatusMessage('No alerts to delete');
        setActionLoading(false);
        return;
      }
      
      // Process in batches similar to mark all as read
      setBatchProgress({
        isActive: true,
        current: 0,
        total: alertsToDelete.length,
        success: 0,
        failed: 0
      });
      
      const results = await processBatch(alertsToDelete, async (alertId) => {
        try {
          await makeRequestWithRetry(`${API_BASE_URL}/api/alerts/${alertId}`, 'delete');
          return { success: true };
        } catch (error) {
          console.error(`Error deleting alert ${alertId}:`, error);
          return { success: false, error };
        }
      });
      
      setStatusMessage(`Deleted ${results.success} alerts. ${results.failed > 0 ? `Failed to delete ${results.failed} alerts.` : ''}`);
      
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error during bulk delete:', error);
      setError('An error occurred during bulk delete');
    } finally {
      setActionLoading(false);
      setBatchProgress(prev => ({ ...prev, isActive: false }));
      setBulkDeleteModalOpen(false);
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Alerts</h1>
            <p className="text-gray-600 mt-1">
              Manage your inventory alerts and notifications
              {lastUpdated && 
                <span className="text-xs ml-2 text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              }
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="relative px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200
                bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
            >
              <ChartBarIcon className="w-4 h-4 mr-2 text-indigo-500" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200
                ${autoRefresh 
                  ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } shadow-sm`}
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin text-green-600' : 'text-gray-500'}`} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
            <button
              onClick={() => fetchAlerts()}
              className="relative px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200
                bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={createTestAlert}
              className="relative px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200
                bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              disabled={actionLoading}
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Create Test Alert
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-green-700">{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Batch Processing Progress */}
      {batchProgress.isActive && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm animate-fadeIn">
          <div className="space-y-2">
            <div className="flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-blue-500 mr-2 animate-spin flex-shrink-0" />
              <span className="text-blue-700 font-medium">Processing alerts in batches: {batchProgress.current} of {batchProgress.total}</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Alerts</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider">Unread</h3>
            <p className="mt-2 text-3xl font-bold text-blue-900">{stats.unread}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-red-700 uppercase tracking-wider">Critical</h3>
            <p className="mt-2 text-3xl font-bold text-red-900">{stats.critical}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-lg shadow-sm border border-yellow-200 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-yellow-700 uppercase tracking-wider">Warnings</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-900">{stats.warning}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg shadow-sm border border-green-200 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-medium text-green-700 uppercase tracking-wider">Info</h3>
            <p className="mt-2 text-3xl font-bold text-green-900">{stats.info}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <FunnelIcon className="w-5 h-5 text-indigo-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          {/* Bulk action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllAsRead}
              className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={actionLoading || alerts.filter(a => !a.read).length === 0}
            >
              <CheckIcon className="w-4 h-4 mr-1.5 text-green-600" />
              Mark All as Read
            </button>
            <button
              onClick={markAllAsResolved}
              className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                text-indigo-700 bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={actionLoading || alerts.filter(a => a.status !== 'resolved').length === 0}
            >
              <XMarkIcon className="w-4 h-4 mr-1.5 text-indigo-600" />
              Mark All as Resolved
            </button>
            <button
              onClick={confirmDeleteAllAlerts}
              className="relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                text-white bg-red-600 border border-red-700 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={actionLoading || alerts.length === 0}
            >
              <TrashIcon className="w-4 h-4 mr-1.5" />
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {((loading && alerts.length > 0) || actionLoading) && !batchProgress.isActive ? (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md">
            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
            {actionLoading ? 'Processing...' : 'Refreshing...'}
          </div>
        </div>
      ) : null}

      {/* Alerts List */}
      <div className="space-y-6">
        {alerts.map((alert) => (
          <div
            key={alert._id}
            className={`border rounded-xl p-5 ${getPriorityColor(alert.priority)} 
              ${!alert.read ? 'ring-2 ring-blue-400' : ''} 
              shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${
                  alert.priority === 'critical' ? 'bg-red-100' : 
                  alert.priority === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                } flex-shrink-0`}>
                  {getPriorityIcon(alert.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 whitespace-pre-line">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                      {new Date(alert.createdAt).toLocaleDateString()} {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                    {getStatusBadge(alert.status)}
                    {alert.type && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 shadow-sm border border-purple-200">
                        {alert.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mt-3 md:mt-0">
                {alert.medicineId && (
                  <button
                    onClick={() => handleViewMedicine(
                      typeof alert.medicineId === 'object' ? alert.medicineId._id : alert.medicineId
                    )}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                      text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    <EyeIcon className="w-4 h-4 mr-1.5" />
                    View
                  </button>
                )}
                {!alert.read && (
                  <button
                    onClick={() => markAsRead(alert._id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                      text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    <CheckIcon className="w-4 h-4 mr-1.5" />
                    Mark as Read
                  </button>
                )}
                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => resolveAlert(alert._id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                      text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    <XMarkIcon className="w-4 h-4 mr-1.5" />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => confirmDeleteAlert(alert)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                    text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  <TrashIcon className="w-4 h-4 mr-1.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <BellIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No alerts</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              There are no alerts matching your filters. You can create a test alert using the button above.
            </p>
          </div>
        )}
      </div>

      {/* Medicine Details Modal */}
      <MedicineDetailsModal
        isOpen={medicineModalOpen}
        onClose={() => setMedicineModalOpen(false)}
        medicineId={selectedMedicineId}
      />
      
      {/* Delete Confirmation Modal for single alert */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Alert"
        message={alertToDelete ? `Are you sure you want to delete this alert about "${alertToDelete.title}"?` : 'Are you sure you want to delete this alert?'}
      />
      
      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={deleteAllAlerts}
        title="Delete All Alerts"
        message={`Are you sure you want to delete all ${alerts.length} alerts? This action cannot be undone.`}
      />
    </div>
  );
}

export default Alerts; 