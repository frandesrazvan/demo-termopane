import { TemplateDefinition } from '../types/templates';

export const PREDEFINED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'geam-simplu-batant',
    name: 'Geam simplu batant (1 canat)',
    itemType: 'window',
    defaultWidthMm: 1000,
    defaultHeightMm: 1200,
    compartments: 1,
    sashConfigs: [
      { openingType: 'tilt-turn', fillType: 'glass' },
    ],
  },
  {
    id: 'geam-dublu-batant',
    name: 'Geam dublu batant (2 canate)',
    itemType: 'window',
    defaultWidthMm: 1400,
    defaultHeightMm: 1200,
    compartments: 2,
    sashConfigs: [
      { openingType: 'tilt-turn', fillType: 'glass' },
      { openingType: 'tilt-turn', fillType: 'glass' },
    ],
  },
  {
    id: 'geam-triplu-batant',
    name: 'Geam triplu batant (3 canate)',
    itemType: 'window',
    defaultWidthMm: 2100,
    defaultHeightMm: 1200,
    compartments: 3,
    sashConfigs: [
      { openingType: 'tilt-turn', fillType: 'glass' },
      { openingType: 'tilt-turn', fillType: 'glass' },
      { openingType: 'tilt-turn', fillType: 'glass' },
    ],
  },
  {
    id: 'usa-simpla',
    name: 'Ușă simplă (1 canat)',
    itemType: 'door',
    defaultWidthMm: 900,
    defaultHeightMm: 2100,
    compartments: 1,
    sashConfigs: [
      { openingType: 'turn', fillType: 'glass' },
    ],
  },
  {
    id: 'usa-dubla-1-geam-1-panel',
    name: 'Ușă dublă (1 geam + 1 panel PVC)',
    itemType: 'door',
    defaultWidthMm: 1600,
    defaultHeightMm: 2100,
    compartments: 2,
    sashConfigs: [
      { openingType: 'turn', fillType: 'glass' },
      { openingType: 'fixed', fillType: 'panel' },
    ],
  },
  {
    id: 'geam-fix',
    name: 'Geam fix (1 compartiment)',
    itemType: 'window',
    defaultWidthMm: 1000,
    defaultHeightMm: 1200,
    compartments: 1,
    sashConfigs: [
      { openingType: 'fixed', fillType: 'glass' },
    ],
  },
  {
    id: 'geam-dublu-1-batant-1-fix',
    name: 'Geam dublu (1 batant + 1 fix)',
    itemType: 'window',
    defaultWidthMm: 1400,
    defaultHeightMm: 1200,
    compartments: 2,
    sashConfigs: [
      { openingType: 'tilt-turn', fillType: 'glass' },
      { openingType: 'fixed', fillType: 'glass' },
    ],
  },
];

