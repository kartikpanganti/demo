import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { PrinterIcon, QrCodeIcon, DocumentDuplicateIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';

const BarcodeGenerator = ({ medicine, onClose }) => {
  const [codeType, setCodeType] = useState('barcode');
  const [copies, setCopies] = useState(1);
  const [size, setSize] = useState('medium');
  const [showScanner, setShowScanner] = useState(false);
  const printRef = useRef(null);

  // Generate unique code based on medicine data
  const generateUniqueCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    return `MED${medicine._id.slice(-4)}${medicine.batchNumber || 'NOBATCH'}${timestamp}`;
  };

  // Generate QR code data with detailed medicine info
  const generateQRData = () => {
    return JSON.stringify({
      id: medicine._id,
      name: medicine.name,
      batch: medicine.batchNumber,
      expiry: medicine.expiryDate,
      manufacturer: medicine.manufacturer,
      stock: medicine.stock,
      timestamp: Date.now()
    });
  };

  // Handle printing
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${medicine.name}_${codeType}`,
    onBeforeGetContent: () => {
      // Ensure the print area is ready
      return new Promise((resolve) => {
        resolve();
      });
    },
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .barcode-container {
          page-break-inside: avoid;
          margin-bottom: 10mm;
        }
      }
    `
  });

  const handleScanComplete = (scannedMedicine) => {
    setShowScanner(false);
    // Handle the scanned medicine data here
    console.log('Scanned medicine:', scannedMedicine);
  };

  // Get size configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 1, height: 30, fontSize: 8, qrSize: 64 };
      case 'large':
        return { width: 2, height: 70, fontSize: 14, qrSize: 256 };
      default: // medium
        return { width: 1.5, height: 50, fontSize: 12, qrSize: 128 };
    }
  };

  const renderCode = () => {
    if (codeType === 'barcode') {
      return (
        <Barcode
          value={generateUniqueCode()}
          width={getSizeConfig().width}
          height={getSizeConfig().height}
          fontSize={getSizeConfig().fontSize}
          displayValue={true}
          text={medicine.name}
        />
      );
    } else {
      return (
        <div>
          <QRCodeSVG
            value={generateQRData()}
            size={getSizeConfig().qrSize}
            level="H"
            includeMargin={true}
          />
          <div className="mt-1 text-sm text-gray-600">{medicine.name}</div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Generate {codeType === 'barcode' ? 'Barcode' : 'QR Code'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Type
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCodeType('barcode')}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    codeType === 'barcode'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <DocumentDuplicateIcon className="h-5 w-5 inline-block mr-2" />
                  Barcode
                </button>
                <button
                  onClick={() => setCodeType('qrcode')}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    codeType === 'qrcode'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <QrCodeIcon className="h-5 w-5 inline-block mr-2" />
                  QR Code
                </button>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex-1 py-2 px-4 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  <ViewfinderCircleIcon className="h-5 w-5 inline-block mr-2" />
                  Scan Code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copies
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-center">
              <div className="barcode-container inline-block mx-2">
                {renderCode()}
              </div>
            </div>
          </div>

          {/* Print Area */}
          <div style={{ display: 'none' }}>
            <div ref={printRef} className="p-4">
              <div className="grid gap-4 grid-cols-2">
                {[...Array(copies)].map((_, index) => (
                  <div key={index} className="barcode-container text-center">
                    {renderCode()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print {copies} {copies === 1 ? 'Copy' : 'Copies'}
            </button>
          </div>
        </div>
      </div>
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
};

export default BarcodeGenerator; 