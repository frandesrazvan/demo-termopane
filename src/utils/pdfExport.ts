import { jsPDF } from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have proper types
import autoTable from 'jspdf-autotable';
import { Quote, Window, OpeningType } from '../types';

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
  sashCount: number
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

  // Draw glass/panel fill (light blue for glass, white for panel)
  doc.setFillColor(224, 242, 254);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  const innerMargin = 5;
  doc.rect(
    startX + innerMargin,
    startY + innerMargin,
    scaledWidth - 2 * innerMargin,
    scaledHeight - 2 * innerMargin,
    'FD'
  );

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

export const exportQuoteToPDF = (quote: Quote, settings: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Generate offer number from quote ID
  const offerNumber = quote.id.slice(-4) || '0001';
  const dateObj = new Date(quote.createdAt);
  const dateStr = dateObj.toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '/');
  const monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

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

  // Process each window/product
  quote.windows.forEach((window, windowIndex) => {
    if (windowIndex > 0) {
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

    const profile = settings.profileSeries.find((p: any) => p.id === window.profileSeriesId);
    const glass = settings.glassTypes.find((g: any) => g.id === window.glassTypeId);
    const hardware = settings.hardwareOptions.find((h: any) => h.id === window.hardwareId);
    const isDoor = quote.productType === 'door';
    const productLabel = isDoor ? 'Ușă' : quote.productType === 'other' ? 'Alt Produs' : 'Fereastră';

    // Product identifier
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${quote.clientName.toUpperCase()}${windowIndex + 1} / ${quote.windows.length} Buc`, margin, yPos);
    yPos += 10;

    // Two-column layout: Drawing on left, specs on right
    const leftColWidth = 80;
    const rightColX = margin + leftColWidth + 10;
    const rightColWidth = pageWidth - rightColX - margin;
    const drawingHeight = 60;

    // Technical drawing (left side)
    drawTechnicalDrawing(
      doc,
      margin,
      yPos,
      leftColWidth,
      drawingHeight,
      window.width,
      window.height,
      isDoor,
      window.sashes.length
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
    if (window.color) {
      doc.setFont('helvetica', 'bold');
      doc.text('Culoare (ext/int):', rightColX, specY);
      doc.setFont('helvetica', 'normal');
      doc.text(window.color, rightColX + 40, specY);
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
    doc.text(`${window.width} × ${window.height} mm`, rightColX + 30, specY);
    specY += 5;

    // Surface area
    const surfaceArea = ((window.width * window.height) / 1000000).toFixed(2);
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
    if (window.sashes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Compartimente:', rightColX, specY);
      specY += 5;
      window.sashes.forEach((sash, idx) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
          `  ${idx + 1}. ${sash.width.toFixed(0)}×${sash.height.toFixed(0)}mm - ${getOpeningTypeLabel(sash.openingType)}`,
          rightColX + 5,
          specY
        );
        specY += 4;
      });
    }

    yPos += drawingHeight + 10;

    // Calculate pricing
    const perimeterMeters = (window.width * 2 + window.height * 2) / 1000;
    const glassAreaSqMeters = (window.width * window.height) / 1000000;
    const profileCost = perimeterMeters * (profile?.pricePerMeter || 0);
    const glassCost = glassAreaSqMeters * (glass?.pricePerSqMeter || 0);
    const hardwareCost = window.sashes.reduce((sum, sash) => {
      if (!hardware) return sum;
      if (sash.openingType === 'turn') return sum + hardware.pricePerTurn;
      if (sash.openingType === 'tilt-turn') return sum + hardware.pricePerTiltTurn;
      return sum;
    }, 0);

    const baseMaterialsCost = profileCost + glassCost + hardwareCost;
    const laborCost = (baseMaterialsCost * quote.laborPercentage) / 100;
    const baseCost = quote.baseCost ?? (baseMaterialsCost + laborCost);

    const markupPercent = quote.markupPercent ?? 0;
    const markupFixed = quote.markupFixed ?? 0;
    const discountPercent = quote.discountPercent ?? 0;
    const discountFixed = quote.discountFixed ?? 0;

    const priceWithMarkup = baseCost * (1 + markupPercent / 100) + markupFixed;
    const discountPercentAmount = priceWithMarkup * (discountPercent / 100);
    const totalDiscount = discountPercentAmount + discountFixed;
    const sellingPrice = quote.sellingPrice ?? Math.max(priceWithMarkup - totalDiscount, 0);
    const vatAmount = quote.vatAmount ?? (sellingPrice * 0.19);
    const finalPriceWithVAT = quote.finalPriceWithVAT ?? (sellingPrice * 1.19);

    // Pricing section - only on last window
    if (windowIndex === quote.windows.length - 1) {
      // Summary section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Suprafata ${surfaceArea} m²`, margin, yPos);
      yPos += 5;
      doc.text(`Pret unitar ${finalPriceWithVAT.toFixed(2)} RON`, margin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`Valoare totala ${baseCost.toFixed(2)} RON`, margin, yPos);
      yPos += 15;

      // Commercial pricing dashboard (right side)
      const pricingX = pageWidth - margin - 80;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', pricingX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${baseCost.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;

      if (discountPercent > 0 || discountFixed > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Discount ${discountPercent > 0 ? discountPercent + '%' : ''}${discountPercent > 0 && discountFixed > 0 ? ' + ' : ''}${discountFixed > 0 ? discountFixed.toFixed(2) + ' RON' : ''}:`, pricingX, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`-${totalDiscount.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Valoare:', pricingX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${sellingPrice.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Cota TVA 19%:', pricingX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${vatAmount.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Valoare lucrare:', pricingX, yPos);
      doc.text(`${finalPriceWithVAT.toFixed(2)} RON`, pageWidth - margin, yPos, { align: 'right' });
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
      doc.text(`Adresa client: ${quote.clientName}`, margin, termsY + 30);
      
      // Closing
      doc.setFont('helvetica', 'normal');
      doc.text('Cu respect,', margin, termsY + 40);
    }
  }

  // Save PDF
  const fileName = `Oferta_${quote.clientName.replace(/\s+/g, '_')}_${new Date(quote.createdAt).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
