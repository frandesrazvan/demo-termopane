/**
 * Pricing utility with real-world business constraints
 */

/** Minimum glass area to bill per cell (in square meters) */
export const MIN_GLASS_AREA = 0.7;

/**
 * Calculate glass cost with minimum billing per cell
 * @param actualArea Actual glass area in square meters
 * @param pricePerSqm Price per square meter
 * @returns Cost with minimum billing applied
 */
export function calculateGlassCostWithMinimum(actualArea: number, pricePerSqm: number): number {
  const billableArea = Math.max(actualArea, MIN_GLASS_AREA);
  return billableArea * pricePerSqm;
}

/**
 * Get hardware package price based on opening type
 * Maps opening types to hardware package names:
 * - tilt_turn -> "Oscilobatant" -> pricePerTiltTurn
 * - turn_left/turn_right -> "Deschidere Simpla" -> pricePerTurn
 * - fixed -> 0 (no hardware)
 */
export function getHardwarePackagePrice(
  openingType: string,
  hardware: { pricePerTurn: number; pricePerTiltTurn: number } | null
): number {
  if (!hardware) return 0;

  // Map opening types to hardware packages
  if (openingType === 'tilt_turn' || openingType === 'tilt-turn') {
    return hardware.pricePerTiltTurn; // Oscilobatant
  } else if (openingType === 'turn' || openingType === 'turn_left' || openingType === 'turn_right') {
    return hardware.pricePerTurn; // Deschidere Simpla
  }
  
  // Fixed, TILT, SLIDING don't use standard hardware
  return 0;
}

/**
 * Material cost breakdown for a single item
 */
export interface MaterialBreakdown {
  profileLengthMeters: number;
  profileCost: number;
  glassAreaSqm: number;
  glassAreaBilledSqm: number; // With minimum billing applied
  glassCost: number;
  hardwareKitsCount: number;
  hardwareCost: number;
  totalMaterialCost: number;
}

/**
 * Calculate material breakdown for a window/door configuration
 */
export function calculateMaterialBreakdown(
  profileLengthMeters: number,
  profilePricePerMeter: number,
  glassPieces: Array<{ width_mm: number; height_mm: number; quantity: number }>,
  glassPricePerSqm: number,
  cells: Array<{ openingType: string }>,
  hardware: { pricePerTurn: number; pricePerTiltTurn: number } | null
): MaterialBreakdown {
  // Profile cost
  const profileCost = profileLengthMeters * profilePricePerMeter;

  // Glass cost with minimum billing
  let totalGlassArea = 0;
  let totalGlassAreaBilled = 0;
  
  glassPieces.forEach((piece) => {
    const area = (piece.width_mm / 1000) * (piece.height_mm / 1000) * piece.quantity;
    totalGlassArea += area;
    totalGlassAreaBilled += Math.max(area, MIN_GLASS_AREA * piece.quantity);
  });

  const glassCost = totalGlassAreaBilled * glassPricePerSqm;

  // Hardware cost (count kits)
  let hardwareKitsCount = 0;
  let hardwareCost = 0;
  
  cells.forEach((cell) => {
    const kitPrice = getHardwarePackagePrice(cell.openingType, hardware);
    if (kitPrice > 0) {
      hardwareKitsCount += 1;
      hardwareCost += kitPrice;
    }
  });

  const totalMaterialCost = profileCost + glassCost + hardwareCost;

  return {
    profileLengthMeters,
    profileCost,
    glassAreaSqm: totalGlassArea,
    glassAreaBilledSqm: totalGlassAreaBilled,
    glassCost,
    hardwareKitsCount,
    hardwareCost,
    totalMaterialCost,
  };
}

