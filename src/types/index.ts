export type OpeningType = 'fixed' | 'turn' | 'tilt-turn';

export interface ProfileSeries {
  id: string;
  name: string;            // keep if used
  manufacturer?: string | null;
  profile_type?: string | null;   // e.g. 'toc', 'cercevea', 'bagheta'
  color_name?: string | null;     // e.g. 'Alb', 'Antracit'
  pricePerMeter: number;
  colorCategory: string;   // keep for backward compatibility
  chambers?: number;
  glass_width_deduction_mm: number;
  glass_height_deduction_mm: number;
  user_id?: string;
}

export interface GlassType {
  id: string;
  name: string;
  pricePerSqMeter: number;
  user_id?: string;
}

// New interface for Glass settings with thickness
export interface GlassSetting {
  id: string;
  name: string;           // e.g. "Tripan 44mm"
  thickness_mm?: number;
  price_per_sqm: number;
}

export interface Hardware {
  id: string;
  name: string;
  pricePerTurn: number;
  pricePerTiltTurn: number;
  user_id?: string;
}

// New interface for Hardware settings
export interface HardwareSetting {
  id: string;
  manufacturer: string;   // e.g. Roto, Siegenia
  name: string;           // e.g. "Oscilobatant", "Simplu"
  price_per_pack: number;
}

// Company settings interface
export interface CompanySettings {
  id: string;
  company_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  registration_number?: string; // Nr. Reg. Com.
  tax_id?: string;              // CUI
  // optional: default material ids for later
  default_profile_series_id?: string | null;
  default_glass_id?: string | null;
  default_hardware_id?: string | null;
}

export interface Sash {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  openingType: OpeningType;
}

export interface Window {
  id: string;
  width: number;
  height: number;
  sashes: Sash[];
  profileSeriesId: string;
  glassTypeId: string;
  hardwareId: string;
  color?: string;
}

export interface Quote {
  id: string;
  clientName: string;
  createdAt: string;
  windows: Window[];
  laborPercentage: number;
  marginPercentage: number;
  totalPrice: number;
  // Commercial pricing details
  baseCost?: number;
  markupPercent?: number;
  markupFixed?: number;
  discountPercent?: number;
  discountFixed?: number;
  sellingPrice?: number;
  vatAmount?: number;
  finalPriceWithVAT?: number;
  productType?: 'window' | 'door' | 'other';
}

export interface Settings {
  profileSeries: ProfileSeries[];
  glassTypes: GlassType[];
  hardwareOptions: Hardware[];
  defaultLaborPercentage: number;
  defaultMarginPercentage: number;
}

// NewQuotePage types
export type OfferTab = 'client' | 'configurator' | 'price';

export interface ClientInfoState {
  name: string;
  phone: string;
  email: string;
  address: string;
  reference: string;
}

export interface NewQuotePageProps {
  onSave?: () => void;
  editQuoteId?: string | null;
  onEditCancel?: () => void;
}
