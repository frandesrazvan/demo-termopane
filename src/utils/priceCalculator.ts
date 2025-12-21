import { QuoteItemInput } from '../types/quotes';
import { MIN_GLASS_AREA } from './pricing';

export interface PricingTotals {
  totalMaterialCost: number;
  subtotalBeforeAdjustments: number;
  priceWithMarkup: number;
  discountAmount: number;
  priceAfterDiscount: number;
  vatAmount: number;
  totalWithVAT: number;
  discountTotal: number;
  vatRate: number;
  // Detailed material breakdown
  totalProfileLengthMeters: number;
  totalGlassAreaSqm: number;
  totalGlassAreaBilledSqm: number;
  totalHardwareKitsCount: number;
}

export interface PricingParams {
  items: QuoteItemInput[];
  markupPercent: number;
  markupFixed: number;
  discountPercent: number;
  discountFixed: number;
  vatRate: number;
}

/**
 * Calculate pricing totals from items with markup, discount, and VAT adjustments
 * Includes detailed material breakdown
 */
export function calculatePricingTotals(params: PricingParams): PricingTotals {
  const { items, markupPercent, markupFixed, discountPercent, discountFixed, vatRate } = params;

  // Sum of base costs (material costs)
  const totalMaterialCost = items.reduce((sum, item) => sum + item.base_cost * item.quantity, 0);
  
  // Sum of prices without VAT (before markup/discount adjustments)
  const subtotalBeforeAdjustments = items.reduce((sum, item) => sum + item.price_without_vat * item.quantity, 0);
  
  // Calculate detailed material breakdown
  let totalProfileLengthMeters = 0;
  let totalGlassAreaSqm = 0;
  let totalGlassAreaBilledSqm = 0;
  let totalHardwareKitsCount = 0;
  
  items.forEach((item) => {
    const quantity = item.quantity || 1;
    
    // Profile length
    if (item.profile_length_m) {
      totalProfileLengthMeters += item.profile_length_m * quantity;
    }
    
    // Glass area (from configuration if available, otherwise from glass_area_sqm)
    if (item.configuration?.glassAreaSqm) {
      totalGlassAreaSqm += item.configuration.glassAreaSqm * quantity;
      // Calculate billed area with minimum (MIN_GLASS_AREA sqm per cell)
      if (item.configuration.glassPieces) {
        item.configuration.glassPieces.forEach((piece) => {
          const actualArea = (piece.width_mm / 1000) * (piece.height_mm / 1000);
          const billableArea = Math.max(actualArea, MIN_GLASS_AREA);
          totalGlassAreaBilledSqm += billableArea * piece.quantity * quantity;
        });
      } else {
        // Fallback: use glassAreaSqm with minimum billing
        const billableArea = Math.max(item.configuration.glassAreaSqm, MIN_GLASS_AREA);
        totalGlassAreaBilledSqm += billableArea * quantity;
      }
    } else if (item.glass_area_sqm) {
      totalGlassAreaSqm += item.glass_area_sqm * quantity;
      const billableArea = Math.max(item.glass_area_sqm, MIN_GLASS_AREA);
      totalGlassAreaBilledSqm += billableArea * quantity;
    }
    
    // Hardware kits count (from configuration sashes)
    if (item.configuration?.sashes) {
      item.configuration.sashes.forEach((sash) => {
        if (sash.openingType === 'tilt-turn' || sash.openingType === 'turn') {
          totalHardwareKitsCount += quantity;
        }
      });
    }
  });
  
  // Apply markup
  const priceWithMarkup = totalMaterialCost > 0 
    ? totalMaterialCost * (1 + markupPercent / 100) + markupFixed 
    : 0;
  
  // Apply discount
  const discountAmount = priceWithMarkup > 0 
    ? (priceWithMarkup * discountPercent / 100) + discountFixed 
    : 0;
  const priceAfterDiscount = Math.max(priceWithMarkup - discountAmount, 0);
  
  // Apply VAT
  const vatAmount = priceAfterDiscount * vatRate;
  const totalWithVAT = priceAfterDiscount + vatAmount;

  // Calculate discount_total for quote header (difference between subtotal and final price)
  const discountTotal = subtotalBeforeAdjustments - priceAfterDiscount;

  return {
    totalMaterialCost,
    subtotalBeforeAdjustments,
    priceWithMarkup,
    discountAmount,
    priceAfterDiscount,
    vatAmount,
    totalWithVAT,
    discountTotal,
    vatRate,
    totalProfileLengthMeters,
    totalGlassAreaSqm,
    totalGlassAreaBilledSqm,
    totalHardwareKitsCount,
  };
}




