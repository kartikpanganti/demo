import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddMedicine from './pages/AddMedicine';
import EditMedicine from './pages/EditMedicine';
import ShowMedicine from './pages/ShowMedicine';
import LowStock from './pages/LowStock';
import ExpiringMedicines from './pages/ExpiringMedicines';
import Alerts from './pages/Alerts';
import ExpiryTracker from './pages/ExpiryTracker';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/add" element={<AddMedicine />} />
            <Route path="/edit/:id" element={<EditMedicine />} />
            <Route path="/show/:id" element={<ShowMedicine />} />
            <Route path="/medicines/:id" element={<ShowMedicine />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/expiring" element={<ExpiringMedicines />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/expiry-tracker" element={<ExpiryTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
