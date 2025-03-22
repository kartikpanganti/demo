import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);

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
                to="/low-stock"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/low-stock')}`}
              >
                Low Stock
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
    </>
  );
}

export default Navbar; 