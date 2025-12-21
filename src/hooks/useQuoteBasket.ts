import { useState } from 'react';
import { QuoteItemInput } from '../types/quotes';
import { WindowConfigData } from '../components/WindowConfigurator';

export interface UseQuoteBasketReturn {
  items: QuoteItemInput[];
  currentItemLabel: string;
  currentItemQuantity: number;
  setCurrentItemLabel: (label: string) => void;
  setCurrentItemQuantity: (quantity: number) => void;
  addItem: (windowConfig: WindowConfigData, vatRate: number) => string[];
  removeItem: (index: number) => void;
  setItems: React.Dispatch<React.SetStateAction<QuoteItemInput[]>>;
  resetCurrentItem: () => void;
}

/**
 * Custom hook for managing quote basket (items list)
 */
export function useQuoteBasket(): UseQuoteBasketReturn {
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [currentItemLabel, setCurrentItemLabel] = useState('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState(1);

  const resetCurrentItem = () => {
    setCurrentItemLabel('');
    setCurrentItemQuantity(1);
  };

  const addItem = (windowConfig: WindowConfigData, vatRate: number): string[] => {
    const validationErrors: string[] = [];

    if (!windowConfig) {
      validationErrors.push('Configurația articolului este invalidă');
    } else {
      if (!windowConfig.selectedProfileId) {
        validationErrors.push('Selectează o serie de profil');
      }
      if (!windowConfig.selectedGlassId) {
        validationErrors.push('Selectează un tip de geam');
      }
      if (!windowConfig.selectedHardwareId) {
        validationErrors.push('Selectează feronerie');
      }
      if (!windowConfig.selectedColor) {
        validationErrors.push('Selectează culoarea');
      }
      if (windowConfig.width <= 0 || windowConfig.height <= 0) {
        validationErrors.push('Dimensiunile trebuie să fie mai mari decât 0');
      }
    }

    if (currentItemQuantity <= 0) {
      validationErrors.push('Cantitatea trebuie să fie mai mare decât 0');
    }

    if (validationErrors.length > 0 || !windowConfig) {
      return validationErrors;
    }

    // Build QuoteItemInput from current config
    // Use base cost from configurator, but we'll apply markup/discount in Price & Export tab
    const itemInput: QuoteItemInput = {
      item_type: windowConfig.productType,
      label: currentItemLabel.trim() || undefined,
      width_mm: windowConfig.width,
      height_mm: windowConfig.height,
      quantity: currentItemQuantity,
      configuration: {
        width: windowConfig.width,
        height: windowConfig.height,
        selectedProfileId: windowConfig.selectedProfileId,
        selectedGlassId: windowConfig.selectedGlassId,
        selectedHardwareId: windowConfig.selectedHardwareId,
        selectedColor: windowConfig.selectedColor,
        sashCount: windowConfig.sashCount,
        sashes: windowConfig.sashes.map(sash => ({
          id: sash.id,
          openingType: sash.openingType,
          fillType: sash.fillType,
        })),
        productType: windowConfig.productType,
        // Store pricing details for reference
        baseCost: windowConfig.baseCost,
        markupPercent: windowConfig.markupPercent,
        markupFixed: windowConfig.markupFixed,
        discountPercent: windowConfig.discountPercent,
        discountFixed: windowConfig.discountFixed,
        sellingPrice: windowConfig.sellingPrice,
        vatAmount: windowConfig.vatAmount,
        finalPriceWithVAT: windowConfig.finalPriceWithVAT,
        profileLengthMeters: windowConfig.profileLengthMeters,
        glassPieces: windowConfig.glassPieces,
        glassAreaSqm: windowConfig.glassAreaSqm,
      },
      // Store base cost (material cost) - pricing adjustments happen at quote level
      base_cost: windowConfig.baseCost,
      // Store the selling price from configurator as initial price_without_vat
      // This will be adjusted by the Price & Export tab controls
      price_without_vat: windowConfig.sellingPrice,
      vat_rate: vatRate,
      total_with_vat: windowConfig.finalPriceWithVAT,
      profile_series_id: windowConfig.selectedProfileId,
      profile_length_m: Math.round(windowConfig.profileLengthMeters * 1000) / 1000,
      glass_area_sqm: Math.round(windowConfig.glassAreaSqm * 1000) / 1000,
    };

    // Add to items array
    setItems([...items, itemInput]);

    // Reset current item
    resetCurrentItem();

    return [];
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return {
    items,
    currentItemLabel,
    currentItemQuantity,
    setCurrentItemLabel,
    setCurrentItemQuantity,
    addItem,
    removeItem,
    setItems,
    resetCurrentItem,
  };
}



