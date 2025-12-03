import { useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have proper types
import autoTable from 'jspdf-autotable';
import { OpeningType } from '../types';
import { QuoteWithItems } from '../types/quotes';
import { X, Download } from 'lucide-react';

const getOpeningTypeLabel = (type: OpeningType): string => {
  switch (type) {
    case 'fixed':
      return 'Fix';
    case 'turn':
      return 'Deschidere';
    case 'tilt-turn':
      return 'Oscilobatant';
    default:
      return type;
  }
};

// Helper to draw a simple window/door technical drawing
const drawTechnicalDrawing = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  windowWidth: number,
  windowHeight: number,
  isDoor: boolean,
  sashCount: number,
  fillTypes?: ('glass' | 'panel')[]
) => {
  const scale = Math.min(width / windowWidth, height / windowHeight) * 0.8;
  const scaledWidth = windowWidth * scale;
  const scaledHeight = windowHeight * scale;
  const startX = x + (width - scaledWidth) / 2;
  const startY = y + 10;

  // Outer frame
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(startX, startY, scaledWidth, scaledHeight);

  // Draw sashes
  if (sashCount > 1) {
    const sashWidth = scaledWidth / sashCount;
    for (let i = 1; i < sashCount; i++) {
      doc.line(startX + i * sashWidth, startY, startX + i * sashWidth, startY + scaledHeight);
    }
  }

  // Draw glass/panel fill per sash
  const innerMargin = 5;
  if (sashCount > 1 && fillTypes && fillTypes.length === sashCount) {
    const sashWidth = scaledWidth / sashCount;
    fillTypes.forEach((fillType, idx) => {
      const sashX = startX + idx * sashWidth;
      if (fillType === 'panel') {
        // White fill for panel
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200);
      } else {
        // Light blue for glass
        doc.setFillColor(224, 242, 254);
        doc.setDrawColor(200, 200, 200);
      }
      doc.setLineWidth(0.5);
      doc.rect(
        sashX + innerMargin,
        startY + innerMargin,
        sashWidth - 2 * innerMargin,
        scaledHeight - 2 * innerMargin,
        'FD'
      );
    });
  } else {
    // Single sash or no fill type info - default to glass
    doc.setFillColor(224, 242, 254);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(
      startX + innerMargin,
      startY + innerMargin,
      scaledWidth - 2 * innerMargin,
      scaledHeight - 2 * innerMargin,
      'FD'
    );
  }

  // Dimensions
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Width dimension (top)
  const dimY = startY - 5;
  doc.line(startX, dimY, startX + scaledWidth, dimY);
  doc.line(startX, dimY - 2, startX, dimY + 2);
  doc.line(startX + scaledWidth, dimY - 2, startX + scaledWidth, dimY + 2);
  doc.text(`${windowWidth}`, startX + scaledWidth / 2, dimY - 3, { align: 'center' });

  // Height dimension (left)
  const dimX = startX - 8;
  doc.line(dimX, startY, dimX, startY + scaledHeight);
  doc.line(dimX - 2, startY, dimX + 2, startY);
  doc.line(dimX - 2, startY + scaledHeight, dimX + 2, startY + scaledHeight);
  doc.text(`${windowHeight}`, dimX - 3, startY + scaledHeight / 2, { align: 'right', angle: 90 });

  // Door threshold indicator
  if (isDoor) {
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(2);
    doc.line(startX, startY + scaledHeight, startX + scaledWidth, startY + scaledHeight);
  }
};

interface PDFPreviewProps {
  quote: QuoteWithItems;
  settings: any;
  onClose: () => void;
}

export default function PDFPreview({ quote, settings, onClose }: PDFPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Generate offer number from quote ID
    const offerNumber = quote.id.slice(-4) || '0001';
    const dateObj = new Date(quote.created_at);
    const dateStr = dateObj.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/');

    // Header - Top section
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Top left: Offer number and date
    doc.text(`Oferta nr. ${offerNumber} / ${dateStr}`, margin, yPos);
    
    // Top right: Program name and page number
    const pageCount = doc.getNumberOfPages();
    doc.text('Realizat cu programul "Fenestra 2000"', pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
    doc.text(`Pagina nr. ${pageCount} / ${pageCount}`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 10;

    // Main title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('OFERTA DE PRET', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Formal greeting
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Stimate Domnule/Doamna,', margin, yPos);
    yPos += 6;
    doc.text('Va prezentam oferta noastra de pret:', margin, yPos);
    yPos += 15;

    // Process each item
    quote.items.forEach((item, itemIndex) => {
      if (itemIndex > 0) {
        doc.addPage();
        yPos = margin;
        // Re-add header for new page
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Oferta nr. ${offerNumber} / ${dateStr}`, margin, yPos);
        const currentPage = doc.getNumberOfPages();
        doc.text(`Pagina nr. ${currentPage} / ${currentPage}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 25;
      }

      const config = item.configuration;
      const profile = settings.profileSeries.find((p: any) => p.id === config.selectedProfileId);
      const glass = settings.glassTypes.find((g: any) => g.id === config.selectedGlassId);
      const hardware = settings.hardwareOptions.find((h: any) => h.id === config.selectedHardwareId);
      const isDoor = item.item_type === 'door';

      // Product identifier
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const itemLabel = item.label || `${item.item_type === 'window' ? 'Fereastră' : item.item_type === 'door' ? 'Ușă' : 'Articol'}`;
      const clientName = quote.client_name || 'Client';
      doc.text(`${clientName.toUpperCase()} - ${itemLabel.toUpperCase()} ${itemIndex + 1} / ${quote.items.length} Buc (Cant: ${item.quantity})`, margin, yPos);
      yPos += 10;

      // Two-column layout: Drawing on left, specs on right
      const leftColWidth = 80;
      const rightColX = margin + leftColWidth + 10;
      const drawingHeight = 60;

      // Technical drawing (left side)
      const fillTypes = config.sashes.map(s => s.fillType);
      drawTechnicalDrawing(
        doc,
        margin,
        yPos,
        leftColWidth,
        drawingHeight,
        item.width_mm,
        item.height_mm,
        isDoor,
        config.sashCount,
        fillTypes
      );

      // Specifications (right side)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let specY = yPos + 5;

      // Profile
      doc.setFont('helvetica', 'bold');
      doc.text('Profil:', rightColX, specY);
      doc.setFont('helvetica', 'normal');
      const profileText = profile ? `${profile.name}, ${profile.chambers} cam` : 'N/A';
      doc.text(profileText, rightColX + 25, specY);
      specY += 5;

      // Color
      if (config.selectedColor) {
        doc.setFont('helvetica', 'bold');
        doc.text('Culoare (ext/int):', rightColX, specY);
        doc.setFont('helvetica', 'normal');
        doc.text(config.selectedColor, rightColX + 40, specY);
        specY += 5;
      }

      // Hardware
      if (hardware) {
        doc.setFont('helvetica', 'bold');
        doc.text('Feronerie:', rightColX, specY);
        doc.setFont('helvetica', 'normal');
        doc.text(hardware.name, rightColX + 25, specY);
        specY += 5;
      }

      // Glass/Panel
      doc.setFont('helvetica', 'bold');
      doc.text('Geam:', rightColX, specY);
      doc.setFont('helvetica', 'normal');
      const glassText = glass ? glass.name : 'N/A';
      doc.text(glassText, rightColX + 25, specY);
      specY += 5;

      // Dimensions
      doc.setFont('helvetica', 'bold');
      doc.text('Dimensiuni:', rightColX, specY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.width_mm} × ${item.height_mm} mm`, rightColX + 30, specY);
      specY += 5;

      // Surface area
      const surfaceArea = ((item.width_mm * item.height_mm) / 1000000).toFixed(2);
      doc.setFont('helvetica', 'bold');
      doc.text('Suprafata:', rightColX, specY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${surfaceArea} m²`, rightColX + 30, specY);
      specY += 5;

      // Door threshold (if door)
      if (isDoor) {
        doc.setFont('helvetica', 'bold');
        doc.text('Prag:', rightColX, specY);
        doc.setFont('helvetica', 'normal');
        doc.text('Prag aluminiu usa', rightColX + 20, specY);
        specY += 5;
      }

      // Sash details
      if (config.sashes.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Compartimente:', rightColX, specY);
        specY += 5;
        const sashWidth = item.width_mm / config.sashCount;
        config.sashes.forEach((sash, idx) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          const fillTypeLabel = sash.fillType === 'panel' ? ' (Panel PVC)' : '';
          doc.text(
            `  ${idx + 1}. ${sashWidth.toFixed(0)}×${item.height_mm.toFixed(0)}mm - ${getOpeningTypeLabel(sash.openingType)}${fillTypeLabel}`,
            rightColX + 5,
            specY
          );
          specY += 4;
        });
      }

      yPos += drawingHeight + 10;

      // Use stored pricing from item
      const baseCost = item.base_cost;
      const sellingPrice = item.price_without_vat;
      const vatAmount = item.total_with_vat - item.price_without_vat;
      const finalPriceWithVAT = item.total_with_vat;
      const itemTotal = finalPriceWithVAT * item.quantity;

      // Pricing section - only on last item
      if (itemIndex === quote.items.length - 1) {
        // Summary section for all items
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Show item summary
        quote.items.forEach((qItem, qIdx) => {
          const qSurfaceArea = ((qItem.width_mm * qItem.height_mm) / 1000000).toFixed(2);
          doc.text(`Articol ${qIdx + 1}: ${qItem.label || 'Fără denumire'} - ${qSurfaceArea} m² × ${qItem.quantity} buc = ${(qItem.total_with_vat * qItem.quantity).toFixed(2)} RON`, margin, yPos);
          yPos += 5;
        });
        
        yPos += 5;

        // Commercial pricing dashboard (right side) - totals for entire quote
        const pricingX = pageWidth - margin - 80;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', pricingX, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${quote.subtotal.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;

        if (quote.discount_total > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Discount:', pricingX, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(`-${quote.discount_total.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Valoare fără TVA:', pricingX, yPos);
        doc.setFont('helvetica', 'normal');
        const priceAfterDiscount = quote.subtotal - quote.discount_total;
        doc.text(`${priceAfterDiscount.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;

        doc.setFont('helvetica', 'bold');
        doc.text(`Cota TVA ${(quote.vat_rate * 100).toFixed(0)}%:`, pricingX, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${quote.vat_amount.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Valoare lucrare:', pricingX, yPos);
        doc.text(`${quote.total.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 15;
      }
    });

    // Add terms page if needed
    const totalPages = doc.getNumberOfPages();
    if (totalPages === 1) {
      doc.addPage();
    }

    // Footer on each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Update page numbers
      doc.text(`Pagina nr. ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      
      // Software version on last page
      if (i === totalPages) {
        doc.setFontSize(7);
        doc.text('Fenestra 2000: 1.0.0', margin, pageHeight - 10);
        doc.text('Model de ofertare dealer (Fara montaj)', margin, pageHeight - 5);
        
        // Terms section
        const termsY = pageHeight - 50;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Termen de livrare:', margin, termsY);
        doc.text('Avans:', margin, termsY + 6);
        doc.text('Garantie:', margin, termsY + 12);
        doc.text('Valabilitatea ofertei:', margin, termsY + 18);
        
        // Client address
        doc.setFont('helvetica', 'normal');
        const clientInfo = [
          quote.client_name && `Nume: ${quote.client_name}`,
          quote.client_address && `Adresă: ${quote.client_address}`,
          quote.client_phone && `Telefon: ${quote.client_phone}`,
          quote.client_email && `Email: ${quote.client_email}`,
        ].filter(Boolean).join(' | ');
        if (clientInfo) {
          doc.text(`Client: ${clientInfo}`, margin, termsY + 30);
        }
        
        // Closing
        doc.setFont('helvetica', 'normal');
        doc.text('Cu respect,', margin, termsY + 40);
      }
    }

    return doc;
  };

  useEffect(() => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    if (iframeRef.current) {
      iframeRef.current.src = pdfUrl;
    }

    return () => {
      URL.revokeObjectURL(pdfUrl);
    };
    // We want to regenerate PDF when quote or settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, settings]);

  const handleExport = () => {
    const doc = generatePDF();
    const clientName = quote.client_name || 'Client';
    const fileName = `Oferta_${clientName.replace(/\s+/g, '_')}_${new Date(quote.created_at).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Previzualizare PDF</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Exportă PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}

