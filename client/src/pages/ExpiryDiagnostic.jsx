import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function ExpiryDiagnostic() {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endpointTests, setEndpointTests] = useState({
    expiring: { loading: false, data: null, error: null },
    expiryTracking: { loading: false, data: null, error: null },
    diagnostics: { loading: false, data: null, error: null }
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test the expiry-test endpoint
      setEndpointTests(prev => ({
        ...prev,
        diagnostics: { loading: true, data: null, error: null }
      }));
      
      const diagnosticsResponse = await axios.get(`${API_BASE_URL}/api/medicines/expiry-test`);
      console.log('Expiry diagnostics data:', diagnosticsResponse.data);
      
      setEndpointTests(prev => ({
        ...prev,
        diagnostics: { loading: false, data: diagnosticsResponse.data, error: null }
      }));
      
      // Test the expiring endpoint
      setEndpointTests(prev => ({
        ...prev,
        expiring: { loading: true, data: null, error: null }
      }));
      
      try {
        const expiringResponse = await axios.get(`${API_BASE_URL}/api/medicines/expiring`);
        console.log('Expiring endpoint data:', expiringResponse.data);
        
        setEndpointTests(prev => ({
          ...prev,
          expiring: { loading: false, data: expiringResponse.data, error: null }
        }));
      } catch (expiringError) {
        console.error('Error testing expiring endpoint:', expiringError);
        setEndpointTests(prev => ({
          ...prev,
          expiring: { 
            loading: false, 
            data: null, 
            error: expiringError.response?.data || expiringError.message 
          }
        }));
      }
      
      // Test the expiry-tracking endpoint
      setEndpointTests(prev => ({
        ...prev,
        expiryTracking: { loading: true, data: null, error: null }
      }));
      
      try {
        const expiryTrackingResponse = await axios.get(`${API_BASE_URL}/api/medicines/expiry-tracking`);
        console.log('Expiry tracking endpoint data:', expiryTrackingResponse.data);
        
        setEndpointTests(prev => ({
          ...prev,
          expiryTracking: { loading: false, data: expiryTrackingResponse.data, error: null }
        }));
      } catch (trackingError) {
        console.error('Error testing expiry-tracking endpoint:', trackingError);
        setEndpointTests(prev => ({
          ...prev,
          expiryTracking: { 
            loading: false, 
            data: null, 
            error: trackingError.response?.data || trackingError.message 
          }
        }));
      }
      
      setDiagnosticData(diagnosticsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error running expiry diagnostics:', error);
      setError(error.response?.data || error.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expiry Diagnostic Tool</h1>
          <p className="text-gray-600 mt-1">
            Diagnostic information for expiry tracking functionality
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          className="btn btn-primary flex items-center"
          disabled={loading}
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error running diagnostics</p>
          <p>{JSON.stringify(error)}</p>
        </div>
      )}

      {diagnosticData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Information</h2>
            <p><strong>Current Date:</strong> {formatDate(diagnosticData.today)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Medicine Counts by Expiry Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-700">Expired</h3>
                <p className="text-2xl font-semibold text-red-900">{diagnosticData.counts.expired}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-700">Critical (0-7 days)</h3>
                <p className="text-2xl font-semibold text-red-900">{diagnosticData.counts.critical}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-700">Warning (8-30 days)</h3>
                <p className="text-2xl font-semibold text-yellow-900">{diagnosticData.counts.warning}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Upcoming (31-90 days)</h3>
                <p className="text-2xl font-semibold text-blue-900">{diagnosticData.counts.upcoming}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">Safe (>90 days)</h3>
                <p className="text-2xl font-semibold text-green-900">{diagnosticData.counts.safe}</p>
              </div>
            </div>
          </div>

          {diagnosticData.sample && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Sample Medicines</h2>
              
              {Object.keys(diagnosticData.sample).map(category => (
                diagnosticData.sample[category] && diagnosticData.sample[category].length > 0 && (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-medium mb-2 capitalize">{category} Medicines</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {diagnosticData.sample[category].map(medicine => (
                            <tr key={medicine._id}>
                              <td className="px-6 py-4 whitespace-nowrap">{medicine.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{medicine.batchNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{formatDate(medicine.expiryDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoint Tests</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">/api/medicines/expiring</h3>
              {endpointTests.expiring.loading && <p>Testing endpoint...</p>}
              {endpointTests.expiring.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                  <p className="font-bold">Error</p>
                  <p>{JSON.stringify(endpointTests.expiring.error)}</p>
                </div>
              )}
              {endpointTests.expiring.data && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2">
                  <p className="font-bold">Success</p>
                  <p>Retrieved {Array.isArray(endpointTests.expiring.data) ? endpointTests.expiring.data.length : 'unknown'} medicines</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">/api/medicines/expiry-tracking</h3>
              {endpointTests.expiryTracking.loading && <p>Testing endpoint...</p>}
              {endpointTests.expiryTracking.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                  <p className="font-bold">Error</p>
                  <p>{JSON.stringify(endpointTests.expiryTracking.error)}</p>
                </div>
              )}
              {endpointTests.expiryTracking.data && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2">
                  <p className="font-bold">Success</p>
                  <p>Retrieved data with {endpointTests.expiryTracking.data.medicines?.length || 0} medicines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpiryDiagnostic; 