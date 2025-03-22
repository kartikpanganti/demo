import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { XMarkIcon, PrinterIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function SaleDetailsModal({ sale, isOpen, onClose, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSale, setEditedSale] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Initialize editedSale when sale data changes
  useState(() => {
    if (sale) {
      setEditedSale({...sale});
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handlePrint = () => {
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Generate invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${sale.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 0.8em; color: #777; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h2>INVOICE</h2>
            <p>Invoice #: ${sale.invoiceNumber}</p>
            <p>Date: ${formatDate(sale.createdAt)}</p>
          </div>
          
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${sale.customer.name}</p>
            <p><strong>Contact:</strong> ${sale.customer.contact}</p>
            ${sale.customer.email ? `<p><strong>Email:</strong> ${sale.customer.email}</p>` : ''}
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal:</strong> $${sale.subTotal.toFixed(2)}</p>
            <p><strong>Tax:</strong> $${sale.tax.toFixed(2)}</p>
            <p><strong>Discount:</strong> $${sale.discount.toFixed(2)}</p>
            <p><strong>Total:</strong> $${sale.total.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${sale.paymentMethod}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Print after content is loaded
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const confirmDelete = () => {
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`${API_BASE_URL}/api/sales/${sale._id}`);
      
      // Notify parent component
      if (onDelete) {
        onDelete(sale._id);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error deleting sale:', error);
      setError('Failed to delete sale. Please try again.');
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Make API call to update sale
      const response = await axios.put(`${API_BASE_URL}/api/sales/${sale._id}`, editedSale);
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating sale:', error);
      setError('Failed to update sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit
      setEditedSale({...sale});
    }
    setIsEditing(!isEditing);
  };

  const handleEditNoteChange = (e) => {
    setEditedSale({
      ...editedSale,
      note: e.target.value
    });
  };

  const handlePaymentMethodChange = (e) => {
    setEditedSale({
      ...editedSale,
      paymentMethod: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-auto py-10">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg m-4">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">
            Invoice #{sale.invoiceNumber}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint}
              className="p-2 rounded-full hover:bg-gray-200 text-blue-600 transition-all"
              title="Print Invoice"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={handleEditToggle}
              className={`p-2 rounded-full transition-all ${isEditing 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-gray-200 text-gray-600'}`}
              title={isEditing ? "Cancel Edit" : "Edit Sale"}
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={confirmDelete}
              className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-all"
              title="Delete Sale"
              disabled={loading}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction Date</h3>
              <p className="text-gray-800">{formatDate(sale.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
              {isEditing ? (
                <select
                  value={editedSale?.paymentMethod || sale.paymentMethod}
                  onChange={handlePaymentMethodChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-800">{sale.paymentMethod}</p>
              )}
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Customer Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{sale.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{sale.customer.contact}</p>
                </div>
                {sale.customer.email && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{sale.customer.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Items */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Purchased Items</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Notes */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Notes</h3>
              {isEditing ? (
                <textarea
                  value={editedSale?.note || ''}
                  onChange={handleEditNoteChange}
                  className="w-full p-3 border rounded-lg"
                  rows="4"
                  placeholder="Add notes here..."
                ></textarea>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
                  {sale.note ? sale.note : <span className="text-gray-400 italic">No notes provided</span>}
                </div>
              )}
            </div>
            
            {/* Order Total */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${sale.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>${sale.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span>${sale.discount.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${sale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice #${sale.invoiceNumber}? This action cannot be undone.`}
      />
    </div>
  );
}

export default SaleDetailsModal; 