import { QuoteWithItems } from '../types/quotes';
import { ProfileSeries, GlassType, Hardware } from '../types';

export interface ProfileSummaryRow {
  manufacturer: string;
  profile_type: string;
  color_name: string;
  total_length_m: number;
}

export interface GlassSummaryRow {
  name: string;
  total_area_sqm: number;
}

export interface HardwareSummaryRow {
  manufacturer: string;
  name: string;
  total_packs: number;
}

export interface QuoteMaterialSummary {
  profiles: ProfileSummaryRow[];
  glass: GlassSummaryRow[];
  hardware: HardwareSummaryRow[];
}

/**
 * Calculate material summary for a quote
 * Groups materials by manufacturer/type/color and sums quantities
 */
export function calculateMaterialSummary(
  quote: QuoteWithItems,
  profileSeriesList: ProfileSeries[],
  glassList: GlassType[],
  hardwareList: Hardware[]
): QuoteMaterialSummary {
  // Maps for grouping
  const profileMap = new Map<string, ProfileSummaryRow>();
  const glassMap = new Map<string, GlassSummaryRow>();
  const hardwareMap = new Map<string, HardwareSummaryRow>();

  quote.items.forEach((item) => {
    const quantity = item.quantity || 1;

    // Process Profile
    if (item.profile_series_id) {
      const profile = profileSeriesList.find((p) => p.id === item.profile_series_id);
      if (profile) {
        // Use stored profile_length_m if available, otherwise approximate
        let lengthM = item.profile_length_m || 0;
        
        // TODO: If profile_length_m is missing, approximate from base_cost and price_per_meter
        // This is a fallback approximation
        if (!lengthM && item.base_cost > 0 && profile.pricePerMeter > 0) {
          lengthM = item.base_cost / profile.pricePerMeter;
        }

        if (lengthM > 0) {
          const key = `${profile.manufacturer || 'N/A'}|${profile.profile_type || 'N/A'}|${profile.color_name || profile.colorCategory || 'N/A'}`;
          const totalLength = lengthM * quantity;

          if (profileMap.has(key)) {
            const existing = profileMap.get(key)!;
            existing.total_length_m += totalLength;
          } else {
            profileMap.set(key, {
              manufacturer: profile.manufacturer || 'N/A',
              profile_type: profile.profile_type || 'N/A',
              color_name: profile.color_name || profile.colorCategory || 'N/A',
              total_length_m: totalLength,
            });
          }
        }
      }
    }

    // Process Glass
    // Try to get glass ID from configuration or use stored glass_area_sqm
    let glassId: string | undefined;
    if (item.configuration?.selectedGlassId) {
      glassId = item.configuration.selectedGlassId;
    }

    let glassArea = item.glass_area_sqm || 0;

    // TODO: If glass_area_sqm is missing, approximate from dimensions
    // This is a fallback approximation
    if (!glassArea && item.width_mm > 0 && item.height_mm > 0) {
      // Approximate: frame area in m²
      glassArea = (item.width_mm * item.height_mm) / 1000000;
    }

    if (glassArea > 0) {
      const glass = glassId ? glassList.find((g) => g.id === glassId) : null;
      const glassName = glass?.name || 'Necunoscut';
      const totalArea = glassArea * quantity;

      if (glassMap.has(glassName)) {
        const existing = glassMap.get(glassName)!;
        existing.total_area_sqm += totalArea;
      } else {
        glassMap.set(glassName, {
          name: glassName,
          total_area_sqm: totalArea,
        });
      }
    }

    // Process Hardware
    // Try to get hardware ID from configuration
    let hardwareId: string | undefined;
    if (item.configuration?.selectedHardwareId) {
      hardwareId = item.configuration.selectedHardwareId;
    }

    // TODO: If hardware_id is missing, we assume 1 pack per item
    // This is a best-effort approximation
    const hardware = hardwareId ? hardwareList.find((h) => h.id === hardwareId) : null;
    
    // Count opening sashes that need hardware
    let packsNeeded = 0;
    if (item.configuration?.sashes) {
      // Count sashes that are not 'fixed' (they need hardware)
      packsNeeded = item.configuration.sashes.filter(
        (sash) => sash.openingType !== 'fixed'
      ).length;
    }
    
    // If no sashes info, assume 1 pack per item
    if (packsNeeded === 0) {
      packsNeeded = 1;
    }

    const totalPacks = packsNeeded * quantity;
    const hardwareName = hardware?.name || 'Necunoscut';
    // For Hardware, we use the name as key since we don't have manufacturer in Hardware interface
    // TODO: When HardwareSetting is fully integrated, use manufacturer + name
    const hardwareKey = hardwareName;

    if (hardwareMap.has(hardwareKey)) {
      const existing = hardwareMap.get(hardwareKey)!;
      existing.total_packs += totalPacks;
    } else {
      hardwareMap.set(hardwareKey, {
        manufacturer: 'N/A', // TODO: Extract from HardwareSetting when available
        name: hardwareName,
        total_packs: totalPacks,
      });
    }
  });

  // Convert maps to sorted arrays
  const profiles = Array.from(profileMap.values()).sort((a, b) => {
    if (a.manufacturer !== b.manufacturer) {
      return a.manufacturer.localeCompare(b.manufacturer);
    }
    if (a.profile_type !== b.profile_type) {
      return a.profile_type.localeCompare(b.profile_type);
    }
    return a.color_name.localeCompare(b.color_name);
  });

  const glass = Array.from(glassMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const hardware = Array.from(hardwareMap.values()).sort((a, b) => {
    if (a.manufacturer !== b.manufacturer) {
      return a.manufacturer.localeCompare(b.manufacturer);
    }
    return a.name.localeCompare(b.name);
  });

  return {
    profiles,
    glass,
    hardware,
  };
}

