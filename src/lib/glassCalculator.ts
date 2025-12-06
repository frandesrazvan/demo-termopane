// Pure calculation helper for glass sizes per compartment
// This function does NOT modify prices; it only calculates additional information

import type { ProfileSeries } from '../types';
import type { ItemConfiguration } from '../types/quotes';

export interface GlassPiece {
  width_mm: number;
  height_mm: number;
  quantity: number;
  area_sqm: number;
}

export interface GlassSummary {
  pieces: GlassPiece[];
  total_area_sqm: number;
}

/**
 * Calculate glass summary for a given item configuration and profile series.
 * This is a pure function that computes glass sizes based on compartment dimensions
 * and profile series glass deductions.
 * 
 * @param config - The item configuration (window/door with sashes/compartments)
 * @param profileSeries - The selected profile series with glass deduction values
 * @returns GlassSummary with grouped pieces and total area
 */
export function calculateGlassSummaryForConfig(
  config: ItemConfiguration,
  profileSeries: ProfileSeries
): GlassSummary {
  if (!config.sashCount || config.sashCount === 0 || !config.sashes || config.sashes.length === 0) {
    return { pieces: [], total_area_sqm: 0 };
  }

  const compartmentWidthMm = config.width / config.sashCount;
  const compartmentHeightMm = config.height;

  // Calculate glass dimensions for each sash that uses glass
  const glassSizes: Array<{ width_mm: number; height_mm: number }> = [];

  config.sashes.forEach((sash) => {
    if (sash.fillType === 'glass') {
      // Apply glass deductions from profile series
      const effectiveWidth = Math.max(
        0,
        compartmentWidthMm - (profileSeries.glass_width_deduction_mm ?? 24)
      );
      const effectiveHeight = Math.max(
        0,
        compartmentHeightMm - (profileSeries.glass_height_deduction_mm ?? 24)
      );
      glassSizes.push({ width_mm: effectiveWidth, height_mm: effectiveHeight });
    }
  });

  // Group identical sizes
  const grouped: Map<string, GlassPiece> = new Map();
  glassSizes.forEach((size) => {
    const key = `${size.width_mm.toFixed(1)}x${size.height_mm.toFixed(1)}`;
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.quantity += 1;
      // Recalculate area for the updated quantity
      existing.area_sqm = (existing.width_mm / 1000) * (existing.height_mm / 1000) * existing.quantity;
    } else {
      const area_sqm = (size.width_mm / 1000) * (size.height_mm / 1000);
      grouped.set(key, {
        width_mm: size.width_mm,
        height_mm: size.height_mm,
        quantity: 1,
        area_sqm,
      });
    }
  });

  const pieces = Array.from(grouped.values());

  // Calculate total glass area in square meters
  const total_area_sqm = pieces.reduce((sum, piece) => sum + piece.area_sqm, 0);

  return {
    pieces,
    total_area_sqm,
  };
}

