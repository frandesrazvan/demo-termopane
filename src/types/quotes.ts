// Reuse the existing WindowConfigData as the base for item configuration
// We'll import the type directly from the configurator
import type { WindowConfigData } from '../components/WindowConfigurator';

// ItemConfiguration is the same as WindowConfigData but without calculatedPrice
// (since we calculate it on the server or store it separately)
export type ItemConfiguration = Omit<WindowConfigData, 'calculatedPrice'>;

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled';

export interface Quote {
  id: string;
  user_id: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  reference?: string;
  status: QuoteStatus;
  subtotal: number;
  discount_total: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  user_id: string;
  item_type: 'window' | 'door' | 'other';
  label?: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  configuration: ItemConfiguration;
  base_cost: number;
  price_without_vat: number;
  vat_rate: number;
  total_with_vat: number;
  profile_series_id?: string;
  profile_length_m?: number;
  glass_area_sqm?: number;
  created_at: string;
}

export interface QuoteWithItems extends Quote {
  items: QuoteItem[];
  // Aggregated material totals (computed on frontend)
  totalProfileLengthBySeries?: Record<string, number>;
  totalGlassAreaSqm?: number;
}

// Input type used when creating a new quote from the UI
export interface QuoteItemInput {
  item_type: 'window' | 'door' | 'other';
  label?: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  configuration: ItemConfiguration;
  base_cost: number;
  price_without_vat: number;
  vat_rate: number;
  total_with_vat: number;
  profile_series_id?: string;
  profile_length_m?: number;
  glass_area_sqm?: number;
}

