import { QuoteItemInput } from '../types/quotes';

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
 */
export function calculatePricingTotals(params: PricingParams): PricingTotals {
  const { items, markupPercent, markupFixed, discountPercent, discountFixed, vatRate } = params;

  // Sum of base costs (material costs)
  const totalMaterialCost = items.reduce((sum, item) => sum + item.base_cost * item.quantity, 0);
  
  // Sum of prices without VAT (before markup/discount adjustments)
  const subtotalBeforeAdjustments = items.reduce((sum, item) => sum + item.price_without_vat * item.quantity, 0);
  
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
  };
}



