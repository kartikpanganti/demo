import React, { useState, useRef, useEffect } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { PrinterIcon, QrCodeIcon, DocumentDuplicateIcon, ViewfinderCircleIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';
import { useReactToPrint } from 'react-to-print';

// Create a separate printable component
const PrintableBarcode = React.forwardRef(({ codeType, medicine, copies, size, renderCode }, ref) => {
  // Function to create minimal QR data
  const createMinimalQRData = (medicine) => {
    return JSON.stringify({
      id: medicine._id,
      name: medicine.name,
      barcode: medicine.barcode || ''
    });
  };

  return (
    <div ref={ref} className="p-4">
      <div className="grid gap-4 grid-cols-2">
        {[...Array(copies)].map((_, index) => (
          <div key={index} className="barcode-container text-center">
            {codeType === 'barcode' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Barcode
                  value={medicine.barcode || `MED${medicine._id.slice(-4)}`}
                  width={size === 'small' ? 1 : size === 'large' ? 2 : 1.5}
                  height={size === 'small' ? 30 : size === 'large' ? 70 : 50}
                  fontSize={size === 'small' ? 8 : size === 'large' ? 14 : 12}
                  displayValue={false}
                />
                <div style={{ marginTop: '8px', fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px', textAlign: 'center', fontWeight: '500' }}>
                  {medicine.name}
                </div>
              </div>
            ) : (
              <div>
                <QRCodeSVG
                  value={createMinimalQRData(medicine)}
                  size={size === 'small' ? 64 : size === 'large' ? 256 : 128}
                  level="M"
                  includeMargin={true}
                />
                <div className="mt-1 text-sm text-gray-600">{medicine.name}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const BarcodeGenerator = ({ medicine, onClose }) => {
  const [barcodeType, setBarcodeType] = useState('barcode');
  const [copies, setCopies] = useState(1);
  const [size, setSize] = useState('medium');
  const [showScanner, setShowScanner] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);
  const printRef = useRef(null);

  // Size configurations for different barcode sizes
  const sizeConfigs = {
    small: { width: 1, height: 30, fontSize: 10, margin: 5 },
    medium: { width: 1.5, height: 50, fontSize: 12, margin: 10 },
    large: { width: 2, height: 70, fontSize: 14, margin: 15 }
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${medicine.name}_barcode`,
  });

  // Generate an array of copies to render
  const barcodeArray = Array.from({ length: copies }, (_, index) => index);

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

  // Function to create minimal QR data to prevent overflow
  const createMinimalQRData = (medicine) => {
    return JSON.stringify({
      id: medicine._id,
      name: medicine.name,
      barcode: medicine.barcode || ''
    });
  };

  const renderCode = (key = null) => {
    if (barcodeType === 'barcode') {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Barcode
            value={medicine.barcode || `MED${medicine._id.slice(-4)}`}
            width={sizeConfigs[size].width}
            height={sizeConfigs[size].height}
            fontSize={sizeConfigs[size].fontSize}
            margin={sizeConfigs[size].margin}
            displayValue={false}
          />
          <div style={{ marginTop: '8px', fontSize: sizeConfigs[size].fontSize, textAlign: 'center', fontWeight: '500' }}>
            {medicine.barcode || `MED${medicine._id.slice(-4)}`}
          </div>
          <div style={{ marginTop: '8px', fontSize: sizeConfigs[size].fontSize, textAlign: 'center', fontWeight: '500' }}>
            {medicine.name}
          </div>
        </div>
      );
    } else {
      return (
        <div key={key}>
          <QRCodeSVG
            value={createMinimalQRData(medicine)}
            size={sizeConfigs[size].height * 2}
            level="H"
          />
          <div className="mt-1 text-sm text-gray-600">{medicine.name}</div>
        </div>
      );
    }
  };

  // Load required external libraries
  useEffect(() => {
    const loadScript = (src, id) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js', 'jspdf-script'),
      loadScript('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js', 'html2canvas-script')
    ]).catch(err => console.error('Failed to load library:', err));
  }, []);

  // Generate a PDF with the barcodes
  const handleGeneratePDF = async () => {
    if (!window.jspdf || !window.html2canvas) {
      alert('PDF generation libraries are still loading. Please try again in a moment.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Fixed layout: 4 columns and 5 rows = 20 barcodes per page
      const barcodesPerRow = 4;
      const rowsPerPage = 5;
      const barcodesPerPage = barcodesPerRow * rowsPerPage; // 20 barcodes per page
      const totalPages = Math.ceil(copies / barcodesPerPage);
      
      // Create PDF with appropriate page size and higher quality settings
      const pdf = new jspdf.jsPDF({
        orientation: 'landscape', // Landscape works better for 4 columns
        unit: 'mm',
        format: 'a4',
        compress: false // Avoid compression to maintain quality
      });
      
      // Process each page
      for (let page = 0; page < totalPages; page++) {
        // Create container for current page
        const pageContainer = document.createElement('div');
        pageContainer.style.width = '297mm'; // A4 landscape width
        pageContainer.style.backgroundColor = 'white';
        pageContainer.style.padding = '10mm';
        
        // Create grid for this page
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${barcodesPerRow}, 1fr)`;
        grid.style.gap = '5mm';
        grid.style.width = '100%';
        
        // Calculate how many barcodes for this page
        const startIdx = page * barcodesPerPage;
        const endIdx = Math.min(startIdx + barcodesPerPage, copies);
        
        // Add barcodes for this page
        for (let i = startIdx; i < endIdx; i++) {
          const barcodeContainer = document.createElement('div');
          barcodeContainer.style.textAlign = 'center';
          barcodeContainer.style.padding = '3mm';
          barcodeContainer.style.border = '1px solid #eaeaea';
          barcodeContainer.style.borderRadius = '2mm';
          
          const barcodeElement = document.createElement('div');
          
          if (barcodeType === 'barcode') {
            const barcodeValue = medicine.barcode || `MED${medicine._id.slice(-4)}`;
            
            // Adjusted for high-quality printing
            const sizeAdjustment = 0.8; // Scale down slightly to fit 4 columns
            
            // Create SVG element for barcode
            const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            
            // Create wrapper container
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            
            // Use JsBarcode to render SVG
            try {
              JsBarcode(svgElement, barcodeValue, {
                width: sizeConfigs[size].width * sizeAdjustment,
                height: sizeConfigs[size].height * sizeAdjustment,
                fontSize: sizeConfigs[size].fontSize * sizeAdjustment,
                margin: sizeConfigs[size].margin * sizeAdjustment,
                displayValue: false,
                format: "CODE128",
                lineColor: "#000",
                background: "#ffffff"
              });
              
              // Add SVG to wrapper
              svgElement.style.margin = '0 auto';
              wrapper.appendChild(svgElement);
              
              // Add name label with proper styling
              const nameLabel = document.createElement('div');
              nameLabel.style.marginTop = '5px';
              nameLabel.style.fontSize = `${sizeConfigs[size].fontSize * sizeAdjustment}px`;
              nameLabel.style.textAlign = 'center';
              nameLabel.style.fontWeight = '500';
              nameLabel.style.width = '100%';
              nameLabel.textContent = medicine.name;
              wrapper.appendChild(nameLabel);
              
              barcodeElement.appendChild(wrapper);
            } catch (e) {
              console.error('Barcode generation error:', e);
              
              // Fallback to text if barcode generation fails
              const errorText = document.createElement('div');
              errorText.textContent = `Barcode: ${barcodeValue}`;
              errorText.style.padding = '10px';
              errorText.style.border = '1px solid #ddd';
              errorText.style.textAlign = 'center';
              
              const nameLabel = document.createElement('div');
              nameLabel.style.marginTop = '5px';
              nameLabel.style.fontSize = `${sizeConfigs[size].fontSize * sizeAdjustment}px`;
              nameLabel.style.fontWeight = '500';
              nameLabel.textContent = medicine.name;
              
              wrapper.appendChild(errorText);
              wrapper.appendChild(nameLabel);
              barcodeElement.appendChild(wrapper);
            }
          } else {
            // QR code with minimal data to prevent overflow
            const qrData = createMinimalQRData(medicine);
            
            // Adjust size for 4-column layout
            const sizeAdjustment = 0.8; // Scale down slightly to fit 4 columns
            const qrSize = sizeConfigs[size].height * 2 * sizeAdjustment;
            
            // Create QR code container
            const qrContainer = document.createElement('div');
            qrContainer.id = `qrcode-page${page}-${i}`;
            qrContainer.style.width = `${qrSize}px`;
            qrContainer.style.height = `${qrSize}px`;
            qrContainer.style.margin = '0 auto';
            
            barcodeElement.appendChild(qrContainer);
            
            try {
              // Generate QR code with error handling at full size
              new QRCode(qrContainer, {
                text: qrData,
                width: qrSize,
                height: qrSize,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
              });
            } catch (e) {
              console.error('QR code generation error:', e);
              // Fallback to even more minimal data
              const fallbackData = JSON.stringify({ id: medicine._id });
              new QRCode(qrContainer, {
                text: fallbackData,
                width: qrSize,
                height: qrSize,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L
              });
            }
            
            // Add name label
            const nameLabel = document.createElement('div');
            nameLabel.style.marginTop = '5px';
            nameLabel.style.fontSize = `${sizeConfigs[size].fontSize * sizeAdjustment}px`;
            nameLabel.style.textAlign = 'center';
            nameLabel.style.fontWeight = '500';
            nameLabel.style.width = '100%';
            nameLabel.textContent = medicine.name;
            barcodeElement.appendChild(nameLabel);
          }
          
          barcodeContainer.appendChild(barcodeElement);
          grid.appendChild(barcodeContainer);
        }
        
        pageContainer.appendChild(grid);
        document.body.appendChild(pageContainer);
        
        // Use html2canvas to capture the page with high resolution
        const canvas = await html2canvas(pageContainer, {
          scale: 4, // Increased resolution for print quality
          backgroundColor: 'white',
          width: pageContainer.offsetWidth,
          height: pageContainer.offsetHeight,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 0
        });
        
        // Remove page container from DOM
        document.body.removeChild(pageContainer);
        
        // Calculate PDF dimensions (in mm)
        const contentWidth = canvas.width;
        const contentHeight = canvas.height;
        const pdfWidth = 297; // A4 landscape width in mm
        const pdfHeight = (contentHeight * pdfWidth) / contentWidth;
        
        // Add new page if not the first page
        if (page > 0) {
          pdf.addPage('a4', 'landscape');
        }
        
        // Add image to PDF with high quality
        pdf.addImage(
          canvas.toDataURL('image/png', 1.0), // Use PNG for better quality
          'PNG',
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined, 
          'FAST'
        );
      }
      
      // Download the multi-page PDF with high quality
      pdf.save(`${medicine.name}_${barcodeType}_${copies}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScanComplete = (scannedMedicine) => {
    setShowScanner(false);
    console.log('Scanned medicine:', scannedMedicine);
  };

  // Add script elements to ensure libraries are loaded
  useEffect(() => {
    // Add JsBarcode for barcode printing
    if (!document.getElementById('jsbarcode-script')) {
      const jsBarcodeScript = document.createElement('script');
      jsBarcodeScript.id = 'jsbarcode-script';
      jsBarcodeScript.src = 'https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      document.body.appendChild(jsBarcodeScript);
    }
    
    // Add QRCode.js for QR code printing
    if (!document.getElementById('qrcodejs-script')) {
      const qrCodeScript = document.createElement('script');
      qrCodeScript.id = 'qrcodejs-script';
      qrCodeScript.src = 'https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js';
      document.body.appendChild(qrCodeScript);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl transform transition-all opacity-100 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Print Barcode</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Type</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBarcodeType('barcode')}
                  className={`flex-1 inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md ${
                    barcodeType === 'barcode'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeType('qrcode')}
                  className={`flex-1 inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md ${
                    barcodeType === 'qrcode'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  QR Code
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="copies" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Copies
              </label>
              <input
                type="number"
                id="copies"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="border p-4 rounded-lg mb-6 bg-white overflow-auto">
            <h3 className="text-md font-medium text-gray-700 mb-4 text-center">Preview</h3>
            <div className="flex justify-center">
              <div className="inline-block p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex flex-col items-center">
                  {barcodeType === 'barcode' ? (
                    <Barcode
                      value={medicine.barcode || medicine._id}
                      width={sizeConfigs[size].width}
                      height={sizeConfigs[size].height}
                      fontSize={sizeConfigs[size].fontSize}
                      margin={sizeConfigs[size].margin}
                      displayValue={false}
                    />
                  ) : (
                    <QRCodeSVG
                      value={medicine.barcode || medicine._id}
                      size={sizeConfigs[size].height * 2}
                      level="H"
                    />
                  )}
                  <p className="text-center mt-2 text-sm text-gray-600 font-medium">
                    {medicine.barcode || medicine._id}
                  </p>
                  <p className="text-center text-sm text-gray-700 font-semibold mt-1">
                    {medicine.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Print area (hidden) */}
          <div className="hidden">
            <div ref={printRef} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {barcodeArray.map((_, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded flex flex-col items-center justify-center text-center">
                    {barcodeType === 'barcode' ? (
                      <Barcode
                        value={medicine.barcode || medicine._id}
                        width={sizeConfigs[size].width}
                        height={sizeConfigs[size].height}
                        fontSize={sizeConfigs[size].fontSize}
                        margin={sizeConfigs[size].margin}
                        displayValue={false}
                      />
                    ) : (
                      <QRCodeSVG
                        value={medicine.barcode || medicine._id}
                        size={sizeConfigs[size].height * 2}
                        level="H"
                      />
                    )}
                    <p className="mt-2 text-sm font-medium">{medicine.barcode || medicine._id}</p>
                    <p className="text-sm font-semibold mt-1">{medicine.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Barcodes
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