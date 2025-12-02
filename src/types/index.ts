export type OpeningType = 'fixed' | 'turn' | 'tilt-turn';

export interface ProfileSeries {
  id: string;
  name: string;
  pricePerMeter: number;
  colorCategory: string;
  chambers: number;
  user_id?: string;
}

export interface GlassType {
  id: string;
  name: string;
  pricePerSqMeter: number;
  user_id?: string;
}

export interface Hardware {
  id: string;
  name: string;
  pricePerTurn: number;
  pricePerTiltTurn: number;
  user_id?: string;
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
