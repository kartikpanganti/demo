import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  XMarkIcon, 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  QrCodeIcon,
  CheckIcon,
  CreditCardIcon,
  PrinterIcon,
  DocumentCheckIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';
import BillReceipt from './BillReceipt';
import MedicineDetailsModal from './MedicineDetailsModal';

function BillingPanel({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', contact: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [note, setNote] = useState('');
  const [taxRate, setTaxRate] = useState(5); // Default 5% tax
  const [discount, setDiscount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [billingStep, setBillingStep] = useState('editing'); // 'editing', 'applied', 'payment-complete'
  const [invoice, setInvoice] = useState(null);
  const printFrameRef = useRef(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);

  useEffect(() => {
    // Reset states when panel opens
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setCart([]);
      setCustomer({ name: '', contact: '', email: '' });
      setPaymentMethod('Cash');
      setNote('');
      setDiscount(0);
      setSuccessMessage('');
      setError('');
      setBillingStep('editing');
      setInvoice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      searchMedicines();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchMedicines = async () => {
    try {
      setSearching(true);
      const response = await axios.get(`${API_BASE_URL}/api/medicines`, {
        params: {
          search: searchQuery,
          limit: 5
        }
      });
      // Filter out medicines with zero stock
      setSearchResults(response.data.medicines.filter(med => med.stock > 0));
    } catch (error) {
      console.error('Error searching medicines:', error);
      setError('Error searching medicines. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const addToCart = (medicine) => {
    // Only allow adding to cart in the editing step
    if (billingStep !== 'editing') {
      setError('Cannot modify cart after it has been applied.');
      return;
    }
    
    // Check if item is already in cart
    const existingItem = cart.find(item => item._id === medicine._id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(cart.map(item => 
        item._id === medicine._id ? 
        { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : 
        item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, {
        _id: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: 1,
        stock: medicine.stock,
        total: medicine.price
      }]);
    }
    
    // Clear search after adding item
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleScanComplete = (scannedMedicine, isContinuousScan = false) => {
    // Only close the scanner if this is NOT part of continuous scanning
    if (!isContinuousScan) {
    setShowScanner(false);
    }
    
    if (scannedMedicine && scannedMedicine._id) {
      // If the medicine has stock, add it to the cart
      if (scannedMedicine.stock > 0) {
        addToCart(scannedMedicine);
      } else {
        setError(`${scannedMedicine.name} is out of stock.`);
      }
    }
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    // Only allow updates in the editing step
    if (billingStep !== 'editing') {
      setError('Cannot modify cart after it has been applied.');
      return;
    }
    
    const item = cart.find(item => item._id === itemId);
    
    // Prevent quantity from exceeding available stock or going below 1
    if (newQuantity > item.stock) {
      setError(`Only ${item.stock} units of ${item.name} available`);
      return;
    }
    
    if (newQuantity < 1) {
      // Remove item if quantity is less than 1
      setCart(cart.filter(item => item._id !== itemId));
    } else {
      // Update quantity and total
      setCart(cart.map(item => 
        item._id === itemId ? 
        { ...item, quantity: newQuantity, total: newQuantity * item.price } : 
        item
      ));
    }
    
    // Clear any error messages
    setError('');
  };

  const removeFromCart = (itemId) => {
    // Only allow removal in the editing step
    if (billingStep !== 'editing') {
      setError('Cannot modify cart after it has been applied.');
      return;
    }
    
    setCart(cart.filter(item => item._id !== itemId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };
  
  // Apply button functionality - validates cart and customer details
  const handleApply = () => {
    if (cart.length === 0) {
      setError('Cart is empty. Please add items to proceed.');
      return;
    }
    
    // Check if required customer fields are filled
    if (!customer.name) {
      setError('Customer name is required to proceed.');
      return;
    }
    
    // Check if any item exceeds stock
    const invalidItems = cart.filter(item => item.quantity > item.stock);
    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map(item => item.name).join(', ');
      setError(`The following items exceed available stock: ${itemNames}`);
      return;
    }
    
    // All checks passed, move to applied state
    setBillingStep('applied');
    setError('');
    setSuccessMessage('Order verified. Ready for payment.');
  };

  // Make Payment button functionality - processes actual payment
  const handlePayment = async () => {
    if (billingStep !== 'applied') {
      setError('Please verify the order first by clicking Apply.');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setError('');
      
      const saleData = {
        customer,
        items: cart.map(item => ({
          medicine: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subTotal: calculateSubtotal(),
        tax: calculateTax(),
        discount,
        total: calculateTotal(),
        paymentMethod,
        note
      };
      
      console.log('Sending sale data to API:', JSON.stringify(saleData, null, 2));
      
        const response = await axios.post(`${API_BASE_URL}/api/sales`, saleData);
      
      console.log('Sale completed successfully:', response.data);
        
        // Store invoice data for printing
        setInvoice({
          invoiceNumber: response.data.invoiceNumber,
          items: cart,
          customer,
          paymentMethod,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          discount,
          total: calculateTotal(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        });
        
      // Update UI
        setBillingStep('payment-complete');
      setSuccessMessage(`Payment successful! Invoice ${response.data.invoiceNumber} generated.`);
      
    } catch (error) {
      console.error('API Error Details:', error);
      
      let errorMessage = 'Error processing payment. Please try again.';
      
      if (error.response) {
        // Server responded with error
        console.error('Server error response:', error.response.data);
        errorMessage = error.response.data.message || 
                      `Server error (${error.response.status}): ${error.response.statusText}`;
                      
        // Special handling for specific error codes
        if (error.response.status === 400) {
          errorMessage = `Invalid data: ${error.response.data.message}`;
        } else if (error.response.status === 404) {
          errorMessage = `Resource not found: ${error.response.data.message}`;  
        } else if (error.response.status === 500) {
          errorMessage = `Server error: ${error.response.data.message || 'Unknown server error'}`;
        }
      } else if (error.request) {
        // Request made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Error in request setup
        console.error('Request setup error:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Print button functionality
  const handlePrint = () => {
    if (!invoice) {
      setError('No completed invoice available to print');
      return;
    }
    
    setShowReceiptModal(true);
  };
  
  const resetBilling = () => {
    setSearchQuery('');
    setCart([]);
    setCustomer({ name: '', contact: '', email: '' });
    setPaymentMethod('Cash');
    setNote('');
    setDiscount(0);
    setSuccessMessage('');
    setError('');
    setBillingStep('editing');
    setInvoice(null);
  };

  // Function to open medicine details modal
  const openMedicineModal = (medicineId) => {
    setSelectedMedicineId(medicineId);
    setModalOpen(true);
  };

  // Function to close medicine details modal
  const closeMedicineModal = () => {
    setModalOpen(false);
    // Don't reset selectedMedicineId immediately to avoid UI flicker
    // during the closing animation
    setTimeout(() => {
      setSelectedMedicineId(null);
    }, 300);
  };

  // Function to add medicine to cart with quantity from modal
  const addToCartFromModal = (medicine, quantity = 1) => {
    addToCart({...medicine, quantity});
    closeMedicineModal();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className={`absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-bold text-primary flex items-center">
              <ShoppingCartIcon className="h-6 w-6 mr-2 animate-cart-bounce text-green-600" />
              Billing
              {billingStep === 'applied' && (
                <span className="ml-3 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending Payment</span>
              )}
              {billingStep === 'payment-complete' && (
                <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
              )}
            </h2>
            <button 
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          {/* Search bar - only show in editing mode */}
          {billingStep === 'editing' && (
            <div className="p-4">
              <div className="flex">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines..."
                    className="w-full p-3 border rounded-l-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {searching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 flex items-center"
                >
                  <QrCodeIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Prominent Scan Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
              >
                <QrCodeIcon className="h-6 w-6 mr-2 animate-pulse" />
                <span className="font-medium">Scan Barcode to Add Product</span>
              </button>
              
              {/* Search results */}
              {searching && searchResults.length > 0 && (
                <div className="p-4 bg-gray-50 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {searchResults.length} medicines found
                  </div>
                  {searchResults.map(medicine => (
                    <div key={medicine._id} className="bg-white mb-2 p-3 shadow-sm rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-xs text-gray-500">{medicine.manufacturer} • Stock: {medicine.stock} {medicine.unit}</div>
                        <div className="mt-1 text-sm font-medium text-gray-900">${medicine.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openMedicineModal(medicine._id)}
                          title="View Details"
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50"
                        >
                          <InformationCircleIcon className="h-6 w-6" />
                        </button>
                        <button 
                          onClick={() => addToCart(medicine)}
                          disabled={medicine.stock <= 0}
                          title={medicine.stock <= 0 ? 'Out of stock' : 'Add to bill'}
                          className={`p-1 rounded-full ${
                            medicine.stock <= 0 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <PlusIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Cart */}
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <ShoppingCartIcon className="h-5 w-5 mr-1 text-primary" />
                Cart Items
              </h3>
              <span className="text-sm text-gray-500">{cart.length} items</span>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Cart is empty. Search or scan medicines to get started.
              </div>
            ) : (
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item._id} className="py-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">${item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {billingStep === 'editing' ? (
                        <>
                          <button 
                            onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <MinusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-200"
                            disabled={item.quantity >= item.stock}
                          >
                            <PlusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <div className="w-20 text-right font-bold">
                            ${item.total.toFixed(2)}
                          </div>
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="p-1 rounded-full hover:bg-gray-200 text-red-500"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="w-8 text-center">{item.quantity} x</span>
                          <div className="w-20 text-right font-bold">
                            ${item.total.toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Customer Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Customer name"
                  disabled={billingStep !== 'editing'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={customer.contact}
                  onChange={(e) => setCustomer({...customer, contact: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Phone number (optional)"
                  disabled={billingStep !== 'editing'}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Email address (optional)"
                  disabled={billingStep !== 'editing'}
                />
              </div>
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                  disabled={billingStep !== 'editing' && billingStep !== 'applied'}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                  disabled={billingStep !== 'editing'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded"
                rows="2"
                placeholder="Add any notes here..."
                disabled={billingStep !== 'editing'}
              ></textarea>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Apply Button - Step 1 */}
            <button
              onClick={handleApply}
              disabled={cart.length === 0 || billingStep !== 'editing'}
              className={`bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 
                disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center
                ${billingStep === 'editing' ? 'md:col-span-3' : 'md:col-span-1'}`}
            >
              <DocumentCheckIcon className="h-5 w-5 mr-2" />
              Apply
            </button>
            
            {/* Make Payment Button - Step 2 */}
            {billingStep !== 'editing' && (
              <button
                onClick={handlePayment}
                disabled={processingPayment || billingStep === 'payment-complete'}
                className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 
                  disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  <>
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Make Payment
                  </>
                )}
              </button>
            )}
            
            {/* Print Button - Step 3 */}
            {billingStep === 'payment-complete' && (
              <button
                onClick={handlePrint}
                className="bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 
                  flex items-center justify-center"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print Invoice
              </button>
            )}
            
            {/* New Sale Button - After completion */}
            {billingStep === 'payment-complete' && (
              <button
                onClick={resetBilling}
                className="bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 
                  flex items-center justify-center"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                New Sale
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Scanner modal */}
      {isOpen && (
        <BarcodeScanner 
          isOpen={showScanner} 
          onClose={() => setShowScanner(false)} 
          onScanComplete={handleScanComplete}
          isBilling={true}
        />
      )}
      
      {/* Medicine Details Modal */}
      {isOpen && (
        <MedicineDetailsModal 
          isOpen={modalOpen}
          onClose={closeMedicineModal}
          medicineId={selectedMedicineId}
          onAddToBill={addToCartFromModal}
        />
      )}
      
      {/* Bill Receipt Modal */}
      {showReceiptModal && invoice && (
        <BillReceipt 
          invoice={invoice}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}

export default BillingPanel; 