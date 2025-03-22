import React, { useState, useRef, useEffect } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { PrinterIcon, QrCodeIcon, DocumentDuplicateIcon, ViewfinderCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';

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
  const [codeType, setCodeType] = useState('barcode');
  const [copies, setCopies] = useState(1);
  const [size, setSize] = useState('medium');
  const [showScanner, setShowScanner] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);
  const printAreaRef = useRef(null);

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
    if (codeType === 'barcode') {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Barcode
            value={medicine.barcode || `MED${medicine._id.slice(-4)}`}
            width={getSizeConfig().width}
            height={getSizeConfig().height}
            fontSize={getSizeConfig().fontSize}
            displayValue={false}
          />
          <div style={{ marginTop: '8px', fontSize: getSizeConfig().fontSize, textAlign: 'center', fontWeight: '500' }}>
            {medicine.name}
          </div>
        </div>
      );
    } else {
      return (
        <div key={key}>
          <QRCodeSVG
            value={createMinimalQRData(medicine)}
            size={getSizeConfig().qrSize}
            level="M"
            includeMargin={true}
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
          
          if (codeType === 'barcode') {
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
                width: getSizeConfig().width * sizeAdjustment,
                height: getSizeConfig().height * sizeAdjustment,
                fontSize: getSizeConfig().fontSize * sizeAdjustment,
                margin: 3,
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
              nameLabel.style.fontSize = `${getSizeConfig().fontSize * sizeAdjustment}px`;
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
              nameLabel.style.fontSize = `${getSizeConfig().fontSize * sizeAdjustment}px`;
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
            const qrSize = getSizeConfig().qrSize * sizeAdjustment;
            
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
            nameLabel.style.fontSize = `${getSizeConfig().fontSize * sizeAdjustment}px`;
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
      pdf.save(`${medicine.name}_${codeType}_${copies}.pdf`);
      
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
            <div className="text-center" ref={previewRef}>
              <div className="barcode-container inline-block mx-2">
                {renderCode()}
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
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
                isGenerating ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generating PDF...' : `Download PDF (${copies} ${copies === 1 ? 'Copy' : 'Copies'})`}
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