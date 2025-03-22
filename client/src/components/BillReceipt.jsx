import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function BillReceipt({ invoice, isOpen, onClose }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice-${invoice?.invoiceNumber}`,
  });

  const generatePDF = async () => {
    if (!componentRef.current) return;
    
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: false
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice-${invoice?.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-auto py-10">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber}</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint}
              className="p-2 rounded-full hover:bg-gray-100 text-blue-600"
              title="Print Receipt"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={generatePDF}
              className="p-2 rounded-full hover:bg-gray-100 text-green-600"
              title="Download PDF"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Printable Receipt Content */}
        <div className="p-6 bg-white">
          <div ref={componentRef} className="mx-auto" style={{ maxWidth: '80mm', padding: '10px' }}>
            {/* Receipt Content */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">RECEIPT</h1>
              <p className="text-sm">{invoice.date} {invoice.time}</p>
              <p className="text-sm font-bold mt-2">Invoice #{invoice.invoiceNumber}</p>
            </div>
            
            {/* Customer */}
            <div className="mb-4 text-sm">
              <p><strong>Customer:</strong> {invoice.customer.name}</p>
              <p><strong>Contact:</strong> {invoice.customer.contact}</p>
              {invoice.customer.email && <p><strong>Email:</strong> {invoice.customer.email}</p>}
            </div>
            
            {/* Items */}
            <div className="mb-4">
              <div className="border-t border-b border-gray-300 py-1 mb-1 text-sm font-bold flex">
                <div className="w-1/2">Item</div>
                <div className="w-1/6 text-center">Qty</div>
                <div className="w-1/6 text-right">Price</div>
                <div className="w-1/6 text-right">Total</div>
              </div>
              
              {invoice.items.map((item, index) => (
                <div key={index} className="text-sm py-1 flex">
                  <div className="w-1/2">{item.name}</div>
                  <div className="w-1/6 text-center">{item.quantity}</div>
                  <div className="w-1/6 text-right">${item.price.toFixed(2)}</div>
                  <div className="w-1/6 text-right">${item.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-300 pt-2 mb-4">
              <div className="text-sm flex justify-between">
                <span>Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Tax:</span>
                <span>${invoice.tax.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="text-sm flex justify-between">
                  <span>Discount:</span>
                  <span>${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="text-base font-bold flex justify-between mt-2">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              <div className="text-sm flex justify-between mt-1">
                <span>Payment Method:</span>
                <span>{invoice.paymentMethod}</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center text-sm mt-6 pt-4 border-t">
              <p className="font-medium">Thank you for your purchase!</p>
              <p className="text-xs mt-2">Please retain this receipt for your records.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillReceipt;