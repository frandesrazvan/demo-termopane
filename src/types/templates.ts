import { OpeningType } from './index';

export type TemplateItemType = 'window' | 'door' | 'other';
export type FillType = 'glass' | 'panel';

export interface TemplateDefinition {
  id: string;
  name: string;
  itemType: TemplateItemType;
  defaultWidthMm: number;
  defaultHeightMm: number;
  compartments: number;
  sashConfigs: {
    openingType: OpeningType;
    fillType: FillType;
  }[];
}

