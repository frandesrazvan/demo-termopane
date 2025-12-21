import { create } from 'zustand';
import {
  WindowObject,
  WindowGrid,
  SashConfig,
  OpeningType,
  FillingType,
  PREDEFINED_TEMPLATES,
  TemplateDefinition,
  calculateCellCount,
} from '../types/configurator';
import { companySettingsService } from '../services/companySettingsService';

interface ConfiguratorState {
  /** Current active window/door configuration */
  activeConfig: WindowObject | null;
  /** ID of the currently selected template */
  selectedTemplateId: string | null;

  // Actions
  /** Load a template and apply it to activeConfig, including default materials from company settings */
  loadTemplate: (templateId: string) => Promise<void>;
  /** Update the root dimensions (width and height) */
  updateDimensions: (width: number, height: number) => void;
  /** Update a specific cell's configuration */
  updateCell: (cellId: string, updates: Partial<SashConfig>) => void;
  /** Set the grid structure and recalculate cells array */
  setGrid: (mullions: number, transoms: number) => void;
  /** Update material IDs (profile, color, glass, hardware) */
  updateMaterials: (updates: {
    profileSeriesId?: string;
    colorId?: string;
    glassTypeId?: string;
    hardwareId?: string;
  }) => void;
  /** Reset the entire configuration */
  resetConfig: () => void;
}

/**
 * Generate a unique cell ID
 */
const generateCellId = (index: number): string => `cell-${index + 1}`;

/**
 * Create a default cell configuration
 */
const createDefaultCell = (index: number): SashConfig => ({
  id: generateCellId(index),
  openingType: OpeningType.FIXED,
  fillingType: FillingType.GLASS,
  hasHandle: false,
});

/**
 * Create a complete WindowObject from a template's baseConfig
 * Fills in missing required fields with defaults
 */
const createWindowObjectFromTemplate = (
  template: TemplateDefinition,
  defaultProfileId: string = '',
  defaultGlassId: string = '',
  defaultHardwareId: string = '',
  defaultColorId: string = ''
): WindowObject => {
  const baseConfig = template.baseConfig;

  // Ensure grid exists
  const grid: WindowGrid = baseConfig.grid || { mullions: 0, transoms: 0 };
  
  // Ensure cells array exists and matches grid
  const expectedCellCount = calculateCellCount(grid);
  let cells: SashConfig[] = baseConfig.cells || [];

  // Validate and fix cells array length
  if (cells.length !== expectedCellCount) {
    if (cells.length < expectedCellCount) {
      // Add missing cells with defaults
      for (let i = cells.length; i < expectedCellCount; i++) {
        cells.push(createDefaultCell(i));
      }
    } else {
      // Truncate excess cells
      cells = cells.slice(0, expectedCellCount);
    }
  }

  // Ensure all cells have unique IDs
  cells = cells.map((cell, index) => ({
    ...cell,
    id: cell.id || generateCellId(index),
  }));

  // Build complete WindowObject
  return {
    width: baseConfig.width || 800,
    height: baseConfig.height || 1200,
    type: baseConfig.type || 'window',
    profileSeriesId: baseConfig.profileSeriesId || defaultProfileId,
    colorId: baseConfig.colorId || defaultColorId,
    glassTypeId: baseConfig.glassTypeId || defaultGlassId,
    hardwareId: baseConfig.hardwareId || defaultHardwareId,
    grid,
    cells,
  };
};

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  activeConfig: null,
  selectedTemplateId: null,

  loadTemplate: async (templateId: string) => {
    // Find the template
    const template = PREDEFINED_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return;
    }

    // Load company settings to get default materials
    let defaultProfileId = '';
    let defaultGlassId = '';
    let defaultHardwareId = '';

    try {
      const companySettings = await companySettingsService.get();
      if (companySettings) {
        defaultProfileId = companySettings.default_profile_series_id || '';
        defaultGlassId = companySettings.default_glass_id || '';
        defaultHardwareId = companySettings.default_hardware_id || '';
      }
    } catch (error) {
      console.warn('Failed to load company settings for defaults:', error);
      // Continue with empty defaults
    }

    // Create complete WindowObject from template
    const windowObject = createWindowObjectFromTemplate(
      template,
      defaultProfileId,
      defaultGlassId,
      defaultHardwareId
    );

    set({
      activeConfig: windowObject,
      selectedTemplateId: templateId,
    });
  },

  updateDimensions: (width: number, height: number) => {
    const { activeConfig } = get();
    if (!activeConfig) {
      console.warn('Cannot update dimensions: no active configuration');
      return;
    }

    set({
      activeConfig: {
        ...activeConfig,
        width,
        height,
      },
    });
  },

  updateCell: (cellId: string, updates: Partial<SashConfig>) => {
    const { activeConfig } = get();
    if (!activeConfig) {
      console.warn('Cannot update cell: no active configuration');
      return;
    }

    set({
      activeConfig: {
        ...activeConfig,
        cells: activeConfig.cells.map((cell) =>
          cell.id === cellId ? { ...cell, ...updates } : cell
        ),
      },
    });
  },

  setGrid: (mullions: number, transoms: number) => {
    const { activeConfig } = get();
    if (!activeConfig) {
      console.warn('Cannot set grid: no active configuration');
      return;
    }

    const newGrid: WindowGrid = { mullions, transoms };
    const newCellCount = calculateCellCount(newGrid);
    const currentCells = activeConfig.cells;
    const currentCellCount = currentCells.length;

    let newCells: SashConfig[];

    if (newCellCount > currentCellCount) {
      // Need more cells: preserve existing, add defaults
      newCells = [...currentCells];
      for (let i = currentCellCount; i < newCellCount; i++) {
        newCells.push(createDefaultCell(i));
      }
    } else if (newCellCount < currentCellCount) {
      // Need fewer cells: truncate array
      newCells = currentCells.slice(0, newCellCount);
    } else {
      // Same count: keep existing cells
      newCells = [...currentCells];
    }

    // Ensure all cells have unique IDs matching their index
    newCells = newCells.map((cell, index) => ({
      ...cell,
      id: generateCellId(index),
    }));

    set({
      activeConfig: {
        ...activeConfig,
        grid: newGrid,
        cells: newCells,
      },
    });
  },

  updateMaterials: (updates) => {
    const { activeConfig } = get();
    if (!activeConfig) {
      console.warn('Cannot update materials: no active configuration');
      return;
    }

    set({
      activeConfig: {
        ...activeConfig,
        ...updates,
      },
    });
  },

  resetConfig: () => {
    set({
      activeConfig: null,
      selectedTemplateId: null,
    });
  },
}));

