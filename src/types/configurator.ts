/**
 * Core Data Model for PVC Window Configurator (CAD-lite)
 * 
 * This module defines the fundamental types and structures for representing
 * window and door configurations in a professional CAD-lite system.
 */

/**
 * Enumeration of window/door opening mechanisms
 */
export enum OpeningType {
  FIXED = 'fixed',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  TILT_TURN = 'tilt_turn',
  TILT = 'tilt',
  SLIDING = 'sliding'
}

/**
 * Enumeration of filling materials for window/door cells
 */
export enum FillingType {
  GLASS = 'glass',
  PANEL_PVC = 'panel_pvc'
}

/**
 * Configuration for a single sash (cell) within a window/door grid
 */
export interface SashConfig {
  /** Unique identifier for this sash */
  id: string;
  /** Opening mechanism type */
  openingType: OpeningType;
  /** Filling material type */
  fillingType: FillingType;
  /** Whether this sash has a handle */
  hasHandle: boolean;
  /** Width ratio relative to other cells in the same row (default: 1) */
  widthRatio: number;
}

/**
 * Grid structure defining the division of a window/door into cells
 */
export interface WindowGrid {
  /** Number of vertical dividers (mullions) */
  mullions: number;
  /** Number of horizontal dividers (transoms) */
  transoms: number;
}

/**
 * Complete window or door object configuration
 * 
 * The number of cells in the `cells` array must equal:
 * (grid.mullions + 1) * (grid.transoms + 1)
 */
export interface WindowObject {
  /** Width in millimeters */
  width: number;
  /** Height in millimeters */
  height: number;
  /** Type of product */
  type: 'window' | 'door' | 'other';
  /** Profile series identifier */
  profileSeriesId: string;
  /** Color identifier */
  colorId: string;
  /** Glass type identifier */
  glassTypeId: string;
  /** Hardware identifier */
  hardwareId: string;
  /** Grid structure defining cell divisions */
  grid: WindowGrid;
  /** Array of sash configurations, one per cell */
  cells: SashConfig[];
}

/**
 * Template definition for quick window/door configuration
 */
export interface TemplateDefinition {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon identifier or path for preview */
  previewIcon: string;
  /** Base configuration that will be applied when template is selected */
  baseConfig: Partial<WindowObject>;
}

/**
 * Predefined templates for Romanian market standards
 */
export const PREDEFINED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'geam-1-canat',
    name: 'Geam 1 Canat',
    previewIcon: 'window-single',
    baseConfig: {
      type: 'window',
      width: 800,
      height: 1200,
      grid: {
        mullions: 0,
        transoms: 0
      },
      cells: [
        {
          id: 'cell-1',
          openingType: OpeningType.TILT_TURN,
          fillingType: FillingType.GLASS,
          hasHandle: true,
          widthRatio: 1
        }
      ]
    }
  },
  {
    id: 'geam-2-canate',
    name: 'Geam 2 Canate',
    previewIcon: 'window-double',
    baseConfig: {
      type: 'window',
      width: 1400,
      height: 1200,
      grid: {
        mullions: 1,
        transoms: 0
      },
      cells: [
        {
          id: 'cell-1',
          openingType: OpeningType.FIXED,
          fillingType: FillingType.GLASS,
          hasHandle: false,
          widthRatio: 1
        },
        {
          id: 'cell-2',
          openingType: OpeningType.TILT_TURN,
          fillingType: FillingType.GLASS,
          hasHandle: true,
          widthRatio: 1
        }
      ]
    }
  },
  {
    id: 'geam-3-canate',
    name: 'Geam 3 Canate',
    previewIcon: 'window-triple',
    baseConfig: {
      type: 'window',
      width: 2100,
      height: 1200,
      grid: {
        mullions: 2,
        transoms: 0
      },
      cells: [
        {
          id: 'cell-1',
          openingType: OpeningType.FIXED,
          fillingType: FillingType.GLASS,
          hasHandle: false,
          widthRatio: 1
        },
        {
          id: 'cell-2',
          openingType: OpeningType.TILT_TURN,
          fillingType: FillingType.GLASS,
          hasHandle: true,
          widthRatio: 1
        },
        {
          id: 'cell-3',
          openingType: OpeningType.FIXED,
          fillingType: FillingType.GLASS,
          hasHandle: false,
          widthRatio: 1
        }
      ]
    }
  },
  {
    id: 'usa-simpla',
    name: 'Ușă Simplă',
    previewIcon: 'door-single',
    baseConfig: {
      type: 'door',
      width: 900,
      height: 2000,
      grid: {
        mullions: 0,
        transoms: 0
      },
      cells: [
        {
          id: 'cell-1',
          openingType: OpeningType.TURN_LEFT,
          fillingType: FillingType.PANEL_PVC,
          hasHandle: true,
          widthRatio: 1
        }
      ]
    }
  },
  {
    id: 'usa-dubla-mix',
    name: 'Ușă Dublă Mix',
    previewIcon: 'door-double-mix',
    baseConfig: {
      type: 'door',
      width: 1600,
      height: 2000,
      grid: {
        mullions: 1,
        transoms: 0
      },
      cells: [
        {
          id: 'cell-1',
          openingType: OpeningType.TURN_LEFT,
          fillingType: FillingType.GLASS,
          hasHandle: true,
          widthRatio: 1
        },
        {
          id: 'cell-2',
          openingType: OpeningType.FIXED,
          fillingType: FillingType.PANEL_PVC,
          hasHandle: false,
          widthRatio: 1
        }
      ]
    }
  }
];

/**
 * Type guard to validate that a WindowObject has the correct number of cells
 * based on its grid configuration
 */
export function validateWindowObject(window: WindowObject): boolean {
  const expectedCells = (window.grid.mullions + 1) * (window.grid.transoms + 1);
  return window.cells.length === expectedCells;
}

/**
 * Helper function to calculate the expected number of cells from a grid
 */
export function calculateCellCount(grid: WindowGrid): number {
  return (grid.mullions + 1) * (grid.transoms + 1);
}

