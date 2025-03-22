import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ViewfinderCircleIcon, ShoppingCartIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import BillingPanel from './BillingPanel';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showBillingPanel, setShowBillingPanel] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100';
  };

  const handleScanComplete = (scannedMedicine) => {
    setShowScanner(false);
    if (scannedMedicine && scannedMedicine._id) {
      navigate(`/medicines/${scannedMedicine._id}`);
    }
  };

  return (
    <>
      <nav className="bg-blue-400 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-primary">
              MediTrack
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
              >
                Dashboard
              </Link>
              <Link
                to="/inventory"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/inventory')}`}
              >
                Inventory
              </Link>
              <Link
                to="/alerts"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/alerts')}`}
              >
                Alerts
              </Link>
              <Link
                to="/expiring"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/expiring')}`}
              >
                Expiring Soon
              </Link>
              <Link
                to="/expiry-tracker"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/expiry-tracker')}`}
              >
                Expiry Tracker
              </Link>
              
              {/* Diagnostic Tool Link */}
              <Link
                to="/expiry-diagnostic"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/expiry-diagnostic')} flex items-center`}
              >
                <Cog6ToothIcon className="h-5 h-5 mr-1" />
                Diagnostic
              </Link>
              
              {/* Sales Link */}
              <Link
                to="/sales"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/sales')} flex items-center`}
              >
                <ChartBarIcon className="h-5 w-5 mr-1" />
                Sales
              </Link>
              
              {/* Billing Button */}
              <button
                onClick={() => setShowBillingPanel(true)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 flex items-center transform transition-transform hover:scale-105"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-1 animate-cart-bounce text-white" />
                Billing
              </button>
              
              <button
                onClick={() => setShowScanner(true)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 flex items-center"
              >
                <ViewfinderCircleIcon className="h-5 w-5 mr-1" />
                Scan Medicine
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScanComplete}
        />
      )}
      
      {showBillingPanel && (
        <BillingPanel
          isOpen={showBillingPanel}
          onClose={() => setShowBillingPanel(false)}
        />
      )}
    </>
  );
}

export default Navbar; 