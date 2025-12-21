import { WindowObject, OpeningType, FillingType } from '../types/configurator';
import { WindowConfigData, GlassPiece } from '../components/WindowConfigurator';
import { Settings } from '../types';
import { MIN_GLASS_AREA, calculateGlassCostWithMinimum, getHardwarePackagePrice } from './pricing';

/**
 * Convert WindowObject from configurator store to WindowConfigData format
 * for compatibility with existing basket/pricing logic
 */
export function convertWindowObjectToConfigData(
  windowObject: WindowObject,
  settings: Settings,
  vatRate: number = 0.19,
  markupPercent: number = 0,
  markupFixed: number = 0,
  discountPercent: number = 0,
  discountFixed: number = 0
): WindowConfigData {
  const { width, height, type, profileSeriesId, glassTypeId, hardwareId, colorId, grid, cells } = windowObject;
  
  // Find materials
  const profile = settings.profileSeries.find((p) => p.id === profileSeriesId);
  const glass = settings.glassTypes.find((g) => g.id === glassTypeId);
  const hardware = settings.hardwareOptions.find((h) => h.id === hardwareId);
  
  // Calculate profile length and cost
  const perimeterMeters = ((width * 2 + height * 2) / 1000);
  const profileCost = profile ? perimeterMeters * profile.pricePerMeter : 0;
  const profileLengthMeters = profile ? perimeterMeters : 0;
  
  // Calculate glass area and cost
  // For grid-based windows, calculate glass area per cell using width ratios
  const cellCount = (grid.mullions + 1) * (grid.transoms + 1);
  const rows = grid.transoms + 1;
  const cols = grid.mullions + 1;
  const cellHeight = (height - (grid.transoms * 40)) / rows; // 40mm = PROFILE_WIDTH
  const availableWidth = width - (grid.mullions * 40);
  
  let totalGlassAreaSqm = 0;
  const glassPieces: GlassPiece[] = [];
  const glassSizesMap = new Map<string, GlassPiece>();
  
  // Calculate cell widths per row based on ratios
  for (let row = 0; row < rows; row++) {
    const rowStartIndex = row * cols;
    const rowCells = cells.slice(rowStartIndex, rowStartIndex + cols);
    
    // Calculate total ratio for this row
    const totalRatio = rowCells.reduce((sum, cell) => sum + (cell.widthRatio || 1), 0);
    
    // Calculate cell widths based on ratios
    rowCells.forEach((cell, colIndex) => {
      if (cell.fillingType === FillingType.GLASS && profile) {
        const ratio = cell.widthRatio || 1;
        const cellWidth = (availableWidth * ratio) / totalRatio;
        
        // Apply glass deductions from profile series
        const glassWidth = Math.max(0, cellWidth - profile.glass_width_deduction_mm);
        const glassHeight = Math.max(0, cellHeight - profile.glass_height_deduction_mm);
        const cellArea = (glassWidth / 1000) * (glassHeight / 1000);
        totalGlassAreaSqm += cellArea;
        
        // Group identical glass sizes
        const key = `${glassWidth.toFixed(1)}x${glassHeight.toFixed(1)}`;
        if (glassSizesMap.has(key)) {
          const existing = glassSizesMap.get(key)!;
          existing.quantity += 1;
        } else {
          glassSizesMap.set(key, {
            width_mm: glassWidth,
            height_mm: glassHeight,
            quantity: 1,
          });
        }
      }
    });
  }
  
  // Calculate glass cost with minimum billing per cell (0.7 sqm minimum per cell)
  let glassCost = 0;
  if (glass) {
    // Apply minimum billing to each glass piece (each piece represents one cell)
    Array.from(glassSizesMap.values()).forEach((piece) => {
      const actualAreaPerCell = (piece.width_mm / 1000) * (piece.height_mm / 1000);
      const billableAreaPerCell = Math.max(actualAreaPerCell, MIN_GLASS_AREA);
      // Multiply by quantity (number of cells with this size)
      glassCost += billableAreaPerCell * glass.pricePerSqMeter * piece.quantity;
    });
  }
  
  // Calculate hardware cost using hardware packages
  // tilt_turn -> Oscilobatant (pricePerTiltTurn)
  // turn_left/turn_right -> Deschidere Simpla (pricePerTurn)
  // fixed -> 0
  let hardwareCost = 0;
  if (hardware) {
    cells.forEach((cell) => {
      const openingTypeStr = cell.openingType === OpeningType.TILT_TURN ? 'tilt_turn' :
                            cell.openingType === OpeningType.TURN_LEFT || cell.openingType === OpeningType.TURN_RIGHT ? 'turn' :
                            'fixed';
      hardwareCost += getHardwarePackagePrice(openingTypeStr, hardware);
    });
  }
  
  // Calculate base materials cost
  const baseMaterialsCost = profileCost + glassCost + hardwareCost;
  
  // Add labor cost (default 15%)
  const laborCost = baseMaterialsCost > 0 ? (baseMaterialsCost * settings.defaultLaborPercentage) / 100 : 0;
  const baseCost = baseMaterialsCost + laborCost;
  
  // Apply markup
  const priceWithMarkup = baseCost > 0 ? baseCost * (1 + markupPercent / 100) + markupFixed : 0;
  
  // Apply discount
  const discountPercentAmount = priceWithMarkup > 0 ? (priceWithMarkup * discountPercent / 100) : 0;
  const totalDiscount = discountPercentAmount + discountFixed;
  const sellingPrice = Math.max(priceWithMarkup - totalDiscount, 0);
  
  // Apply VAT
  const vatAmount = sellingPrice * vatRate;
  const finalPriceWithVAT = sellingPrice + vatAmount;
  
  // Convert cells to sashes format (for compatibility)
  const sashes = cells.map((cell) => ({
    id: cell.id,
    openingType: convertOpeningType(cell.openingType),
    fillType: cell.fillingType === FillingType.GLASS ? 'glass' : 'panel',
  }));
  
  // Determine sashCount (1, 2, or 3)
  const sashCount = Math.min(Math.max(cellCount, 1), 3) as 1 | 2 | 3;
  
  return {
    width,
    height,
    selectedProfileId: profileSeriesId,
    selectedGlassId: glassTypeId,
    selectedHardwareId: hardwareId,
    selectedColor: colorId || '',
    sashCount,
    sashes,
    calculatedPrice: baseMaterialsCost,
    productType: type,
    baseCost,
    markupPercent,
    markupFixed,
    discountPercent,
    discountFixed,
    sellingPrice,
    vatAmount,
    finalPriceWithVAT,
    glassPieces: Array.from(glassSizesMap.values()),
    glassAreaSqm: totalGlassAreaSqm,
    profileLengthMeters,
  };
}

/**
 * Convert OpeningType enum to old OpeningType string format
 */
function convertOpeningType(openingType: OpeningType): 'fixed' | 'turn' | 'tilt-turn' {
  switch (openingType) {
    case OpeningType.FIXED:
      return 'fixed';
    case OpeningType.TURN_LEFT:
    case OpeningType.TURN_RIGHT:
      return 'turn';
    case OpeningType.TILT_TURN:
      return 'tilt-turn';
    case OpeningType.TILT:
    case OpeningType.SLIDING:
      // Map to closest equivalent
      return 'tilt-turn';
    default:
      return 'fixed';
  }
}

