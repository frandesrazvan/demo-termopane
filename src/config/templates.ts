// src/config/templates.ts

export type TemplateItemType = 'window' | 'door' | 'other';

export interface TemplateDefinition {
  id: string;
  name: string;
  itemType: TemplateItemType;
  defaultWidthMm: number;
  defaultHeightMm: number;
  compartments: number;
  sashConfigs: {
    openingType: 'fixed' | 'turn' | 'tilt-turn';
    fillType: 'glass' | 'panel';
  }[];
}

export const PREDEFINED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'geam-1-canat',
    name: 'Geam Simplu (1 Canat)',
    itemType: 'window',
    defaultWidthMm: 800,
    defaultHeightMm: 1200,
    compartments: 1,
    sashConfigs: [{ openingType: 'tilt-turn', fillType: 'glass' }]
  },
  {
    id: 'geam-2-canate',
    name: 'Geam Dublu (2 Canate)',
    itemType: 'window',
    defaultWidthMm: 1400,
    defaultHeightMm: 1200,
    compartments: 2,
    sashConfigs: [
      { openingType: 'fixed', fillType: 'glass' },
      { openingType: 'tilt-turn', fillType: 'glass' }
    ]
  },
  {
    id: 'geam-3-canate',
    name: 'Geam Triplu (3 Canate)',
    itemType: 'window',
    defaultWidthMm: 2100,
    defaultHeightMm: 1200,
    compartments: 3,
    sashConfigs: [
      { openingType: 'fixed', fillType: 'glass' },
      { openingType: 'tilt-turn', fillType: 'glass' },
      { openingType: 'fixed', fillType: 'glass' }
    ]
  },
  {
    id: 'usa-simpla',
    name: 'Ușă Simplă (Panel PVC)',
    itemType: 'door',
    defaultWidthMm: 900,
    defaultHeightMm: 2000,
    compartments: 1,
    sashConfigs: [{ openingType: 'turn', fillType: 'panel' }]
  },
  {
    id: 'usa-dubla-mix',
    name: 'Ușă Dublă (Sticlă + Panel)',
    itemType: 'door',
    defaultWidthMm: 1600,
    defaultHeightMm: 2000,
    compartments: 2,
    sashConfigs: [
      { openingType: 'turn', fillType: 'glass' },
      { openingType: 'fixed', fillType: 'panel' }
    ]
  }
];