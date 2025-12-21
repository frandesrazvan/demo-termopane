import { useState, useMemo } from 'react';
import { useConfiguratorStore } from '../../store/userConfiguratorStore';
import { useStore } from '../../store/useStore';
import { PREDEFINED_TEMPLATES } from '../../types/configurator';
import { OpeningType, FillingType } from '../../types/configurator';
import { PROFILE_COLORS } from '../../constants/profileConstants';
import { 
  Square, 
  RectangleHorizontal, 
  Grid3x3, 
  DoorOpen, 
  DoorClosed,
  Plus,
  Minus
} from 'lucide-react';

interface ConfiguratorControlsProps {
  /** Currently selected cell ID (from WindowVisualizer) */
  selectedCellId?: string | null;
  /** Callback when a cell is selected */
  onCellSelect?: (cellId: string | null) => void;
}

/**
 * Get icon component for template preview
 */
function getTemplateIcon(iconName: string) {
  switch (iconName) {
    case 'window-single':
      return <Square className="w-8 h-8" />;
    case 'window-double':
      return <RectangleHorizontal className="w-8 h-8" />;
    case 'window-triple':
      return <Grid3x3 className="w-8 h-8" />;
    case 'door-single':
      return <DoorOpen className="w-8 h-8" />;
    case 'door-double-mix':
      return <DoorClosed className="w-8 h-8" />;
    default:
      return <Square className="w-8 h-8" />;
  }
}

/**
 * Get Romanian label for opening type
 */
function getOpeningTypeLabel(openingType: OpeningType): string {
  switch (openingType) {
    case OpeningType.FIXED:
      return 'Fix';
    case OpeningType.TURN_LEFT:
    case OpeningType.TURN_RIGHT:
      return 'Bătător';
    case OpeningType.TILT_TURN:
      return 'Oscilobatant';
    case OpeningType.TILT:
      return 'Basculant';
    case OpeningType.SLIDING:
      return 'Glisant';
    default:
      return openingType;
  }
}

export default function ConfiguratorControls({ 
  selectedCellId, 
  onCellSelect 
}: ConfiguratorControlsProps) {
  const { activeConfig, selectedTemplateId, loadTemplate, updateDimensions, updateCell, updateCellWidthRatio, setGrid, updateMaterials } = useConfiguratorStore();
  const { settings } = useStore();
  
  // Local state for material selection
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  
  // Get selected cell configuration
  const selectedCell = useMemo(() => {
    if (!activeConfig || !selectedCellId) return null;
    return activeConfig.cells.find(cell => cell.id === selectedCellId);
  }, [activeConfig, selectedCellId]);
  
  // Get unique manufacturers from profile series
  const manufacturers = useMemo(() => {
    const unique = new Set<string>();
    settings.profileSeries.forEach(profile => {
      if (profile.manufacturer) {
        unique.add(profile.manufacturer);
      }
    });
    return Array.from(unique).sort();
  }, [settings.profileSeries]);
  
  // Get filtered profile series by manufacturer
  const filteredProfileSeries = useMemo(() => {
    if (!selectedManufacturer) {
      return settings.profileSeries;
    }
    return settings.profileSeries.filter(profile => profile.manufacturer === selectedManufacturer);
  }, [settings.profileSeries, selectedManufacturer]);
  
  // Get unique colors from filtered profile series
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    filteredProfileSeries.forEach(profile => {
      const color = profile.color_name || profile.colorCategory;
      if (color) {
        colors.add(color);
      }
    });
    // Also include all standard colors
    PROFILE_COLORS.forEach(color => colors.add(color));
    return Array.from(colors).sort();
  }, [filteredProfileSeries]);
  
  // Handle dimension changes
  const handleWidthChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && activeConfig) {
      updateDimensions(numValue, activeConfig.height);
    }
  };
  
  const handleHeightChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && activeConfig) {
      updateDimensions(activeConfig.width, numValue);
    }
  };
  
  // Handle grid changes
  const handleMullionsChange = (delta: number) => {
    if (!activeConfig) return;
    const newMullions = Math.max(0, activeConfig.grid.mullions + delta);
    setGrid(newMullions, activeConfig.grid.transoms);
  };
  
  const handleTransomsChange = (delta: number) => {
    if (!activeConfig) return;
    const newTransoms = Math.max(0, activeConfig.grid.transoms + delta);
    setGrid(activeConfig.grid.mullions, newTransoms);
  };
  
  // Handle cell updates
  const handleCellFillingTypeChange = (fillingType: FillingType) => {
    if (!selectedCellId) return;
    updateCell(selectedCellId, { fillingType });
  };
  
  const handleCellOpeningTypeChange = (openingType: OpeningType) => {
    if (!selectedCellId) return;
    updateCell(selectedCellId, { openingType });
  };
  
  const handleCellWidthRatioChange = (ratio: number) => {
    if (!selectedCellId) return;
    updateCellWidthRatio(selectedCellId, ratio);
  };
  
  // Handle material changes
  const handleProfileSeriesChange = (profileSeriesId: string) => {
    updateMaterials({ profileSeriesId });
  };
  
  const handleColorChange = (colorId: string) => {
    updateMaterials({ colorId });
  };
  
  return (
    <div className="space-y-4">
      {/* Template Quick-Picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Template</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {PREDEFINED_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => loadTemplate(template.id)}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center gap-2
                w-20 h-20 rounded-lg border-2 transition-all
                ${selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className={selectedTemplateId === template.id ? 'text-blue-600' : 'text-gray-600'}>
                {getTemplateIcon(template.previewIcon)}
              </div>
              <span className={`text-xs font-medium ${selectedTemplateId === template.id ? 'text-blue-700' : 'text-gray-700'}`}>
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Dimensions */}
      {activeConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Dimensiuni</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Lățime (mm)
              </label>
              <input
                type="number"
                value={activeConfig.width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="w-full h-14 px-4 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                step="10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Înălțime (mm)
              </label>
              <input
                type="number"
                value={activeConfig.height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="w-full h-14 px-4 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                step="10"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Cell Editor (Conditional) */}
      {selectedCell && activeConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Setări Celulă</h3>
            <button
              onClick={() => onCellSelect?.(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Închide
            </button>
          </div>
          
          {/* Filling Type Toggle */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tip Umplere
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCellFillingTypeChange(FillingType.GLASS)}
                className={`
                  flex-1 h-12 rounded-lg border-2 font-medium text-sm transition-all
                  ${selectedCell.fillingType === FillingType.GLASS
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Sticlă
              </button>
              <button
                onClick={() => handleCellFillingTypeChange(FillingType.PANEL_PVC)}
                className={`
                  flex-1 h-12 rounded-lg border-2 font-medium text-sm transition-all
                  ${selectedCell.fillingType === FillingType.PANEL_PVC
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Panel PVC
              </button>
            </div>
          </div>
          
          {/* Opening Type Segmented Control */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tip Deschidere
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                OpeningType.FIXED,
                OpeningType.TURN_LEFT,
                OpeningType.TILT_TURN,
              ].map((openingType) => {
                const isSelected = selectedCell.openingType === openingType;
                return (
                  <button
                    key={openingType}
                    onClick={() => handleCellOpeningTypeChange(openingType)}
                    className={`
                      h-12 rounded-lg border-2 font-medium text-xs transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {getOpeningTypeLabel(openingType)}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Width Ratio Control (only for cells in rows with multiple cells) */}
          {activeConfig.grid.mullions > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Lățime Relativă
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={selectedCell.widthRatio ?? 1}
                  onChange={(e) => handleCellWidthRatioChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={selectedCell.widthRatio ?? 1}
                  onChange={(e) => handleCellWidthRatioChange(parseFloat(e.target.value) || 1)}
                  className="w-20 h-12 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Raportul lățimii acestei celule față de celelalte din același rând
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Grid Controls */}
      {activeConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Grilă</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Mullions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Mullions (Vertical)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMullionsChange(-1)}
                  disabled={activeConfig.grid.mullions === 0}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex-1 h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-700">
                  {activeConfig.grid.mullions}
                </div>
                <button
                  onClick={() => handleMullionsChange(1)}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            
            {/* Transoms */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Transoms (Orizontal)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTransomsChange(-1)}
                  disabled={activeConfig.grid.transoms === 0}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex-1 h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-700">
                  {activeConfig.grid.transoms}
                </div>
                <button
                  onClick={() => handleTransomsChange(1)}
                  className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Material Selectors */}
      {activeConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Materiale</h3>
          <div className="space-y-4">
            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Producător
              </label>
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Toți producătorii</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Profile Series */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Seria Profil
              </label>
              <select
                value={activeConfig.profileSeriesId || ''}
                onChange={(e) => handleProfileSeriesChange(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Selectează seria...</option>
                {filteredProfileSeries
                  .sort((a, b) => {
                    // For doors, prioritize profiles with "usa" or "door" in name
                    if (activeConfig.type === 'door') {
                      const aIsDoor = a.name?.toLowerCase().includes('usa') || a.name?.toLowerCase().includes('door');
                      const bIsDoor = b.name?.toLowerCase().includes('usa') || b.name?.toLowerCase().includes('door');
                      if (aIsDoor && !bIsDoor) return -1;
                      if (!aIsDoor && bIsDoor) return 1;
                    }
                    return 0;
                  })
                  .map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.manufacturer ? `${profile.manufacturer} - ` : ''}{profile.name}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Culoare
              </label>
              <select
                value={activeConfig.colorId || ''}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Selectează culoarea...</option>
                {availableColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

