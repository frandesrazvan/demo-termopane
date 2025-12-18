import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { OpeningType } from '../types';
import { TemplateDefinition } from '../types/templates';
import WindowPreview from './configurator/WindowPreview';

type ProductType = 'window' | 'door' | 'other';

const MIN_DIMENSION = 400;
const MAX_DIMENSION = 2500;

interface SashConfig {
  id: string;
  openingType: OpeningType;
  fillType: 'glass' | 'panel';
}

export interface GlassPiece {
  width_mm: number;
  height_mm: number;
  quantity: number;
}

export interface WindowConfigData {
  width: number;
  height: number;
  selectedProfileId: string;
  selectedGlassId: string;
  selectedHardwareId: string;
  selectedColor: string;
  sashCount: 1 | 2 | 3;
  sashes: SashConfig[];
  calculatedPrice: number;
  productType: ProductType;
  // Pricing details
  baseCost: number;
  markupPercent: number;
  markupFixed: number;
  discountPercent: number;
  discountFixed: number;
  sellingPrice: number;
  vatAmount: number;
  finalPriceWithVAT: number;
  // Glass piece details
  glassPieces: GlassPiece[];
  glassAreaSqm: number;
  // Profile length details
  profileLengthMeters: number;
}

interface WindowConfiguratorProps {
  onConfigChange?: (config: WindowConfigData) => void;
  initialProfileId?: string;
  initialGlassId?: string;
  initialHardwareId?: string;
  hidePricing?: boolean;
  template?: TemplateDefinition | null;
  onTemplateApplied?: () => void;
}

export default function WindowConfigurator({ 
  onConfigChange,
  initialProfileId = '',
  initialGlassId = '',
  initialHardwareId = '',
  hidePricing = false,
  template = null,
  onTemplateApplied,
}: WindowConfiguratorProps) {
  const { settings } = useStore();

  // Window dimensions
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1200);

  // Product type
  const [productType, setProductType] = useState<ProductType>('window');

  // Configuration selections
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId);
  const [selectedGlassId, setSelectedGlassId] = useState<string>(initialGlassId);
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>(initialHardwareId);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sashCount, setSashCount] = useState<1 | 2 | 3>(1);

  // Update selections when initial values change
  useEffect(() => {
    if (initialProfileId) setSelectedProfileId(initialProfileId);
    if (initialGlassId) setSelectedGlassId(initialGlassId);
    if (initialHardwareId) setSelectedHardwareId(initialHardwareId);
  }, [initialProfileId, initialGlassId, initialHardwareId]);

  // Apply template when it changes
  useEffect(() => {
    if (template) {
      // Set product type
      setProductType(template.itemType);
      
      // Set dimensions
      setWidth(template.defaultWidthMm);
      setHeight(template.defaultHeightMm);
      
      // Set sash count
      const count = template.compartments as 1 | 2 | 3;
      setSashCount(count);
      
      // Set sash configurations
      const newSashes: SashConfig[] = template.sashConfigs.map((config, index) => ({
        id: String(index + 1),
        openingType: config.openingType as OpeningType,
        fillType: config.fillType,
      }));
      setSashes(newSashes);
      
      // Auto-select default materials from company settings
      if (initialProfileId) {
        setSelectedProfileId(initialProfileId);
      }
      if (initialGlassId) {
        setSelectedGlassId(initialGlassId);
      }
      if (initialHardwareId) {
        setSelectedHardwareId(initialHardwareId);
      }
      
      if (onTemplateApplied) {
        onTemplateApplied();
      }
    }
  }, [template, onTemplateApplied, initialProfileId, initialGlassId, initialHardwareId]);

  // Sash configurations
  const [sashes, setSashes] = useState<SashConfig[]>([
    { id: '1', openingType: 'fixed', fillType: 'glass' },
  ]);

  // Commercial pricing controls
  const [markupPercent, setMarkupPercent] = useState<number>(20);
  const [markupFixed, setMarkupFixed] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFixed, setDiscountFixed] = useState<number>(0);

  // Calculate price
  const calculatedPrice = useMemo(() => {
    if (!selectedProfileId || !selectedGlassId || !selectedHardwareId) {
      return 0;
    }

    const profile = settings.profileSeries.find((p) => p.id === selectedProfileId);
    const glass = settings.glassTypes.find((g) => g.id === selectedGlassId);
    const hardware = settings.hardwareOptions.find((h) => h.id === selectedHardwareId);

    if (!profile || !glass || !hardware) {
      return 0;
    }

    // Calculate perimeter (2 * width + 2 * height) in meters
    const perimeterMeters = ((width * 2 + height * 2) / 1000);
    const profileCost = perimeterMeters * profile.pricePerMeter;

    // Calculate glass area in square meters
    const glassAreaSqMeters = ((width * height) / 1000000);
    const glassCost = glassAreaSqMeters * glass.pricePerSqMeter;

    // Calculate hardware cost based on opening types
    let hardwareCost = 0;
    sashes.forEach((sash) => {
      if (sash.openingType === 'turn') {
        hardwareCost += hardware.pricePerTurn;
      } else if (sash.openingType === 'tilt-turn') {
        hardwareCost += hardware.pricePerTiltTurn;
      }
      // Fixed windows don't need hardware
    });

    return profileCost + glassCost + hardwareCost;
  }, [width, height, selectedProfileId, selectedGlassId, selectedHardwareId, sashes, settings]);

  // Calculate profile length and cost
  const { profileLengthMeters, profileCost } = useMemo(() => {
    if (!selectedProfileId) return { profileLengthMeters: 0, profileCost: 0 };
    const profile = settings.profileSeries.find((p) => p.id === selectedProfileId);
    if (!profile) return { profileLengthMeters: 0, profileCost: 0 };
    // Calculate perimeter (2 * width + 2 * height) in meters
    // This is the total linear meters of profile needed for the frame
    const perimeterMeters = ((width * 2 + height * 2) / 1000);
    const cost = perimeterMeters * profile.pricePerMeter;
    return { profileLengthMeters: perimeterMeters, profileCost: cost };
  }, [width, height, selectedProfileId, settings.profileSeries]);

  const glassCost = useMemo(() => {
    if (!selectedGlassId) return 0;
    const glass = settings.glassTypes.find((g) => g.id === selectedGlassId);
    if (!glass) return 0;
    const glassAreaSqMeters = ((width * height) / 1000000);
    return glassAreaSqMeters * glass.pricePerSqMeter;
  }, [width, height, selectedGlassId, settings.glassTypes]);

  const hardwareCost = useMemo(() => {
    if (!selectedHardwareId) return 0;
    const hardware = settings.hardwareOptions.find((h) => h.id === selectedHardwareId);
    if (!hardware) return 0;
    let cost = 0;
    sashes.forEach((sash) => {
      if (sash.openingType === 'turn') {
        cost += hardware.pricePerTurn;
      } else if (sash.openingType === 'tilt-turn') {
        cost += hardware.pricePerTiltTurn;
      }
    });
    return cost;
  }, [selectedHardwareId, sashes, settings.hardwareOptions]);

  // Calculate glass pieces per compartment (cotele la sticlă)
  const { glassPieces, glassAreaSqm } = useMemo(() => {
    if (!selectedProfileId) {
      return { glassPieces: [], glassAreaSqm: 0 };
    }

    const profile = settings.profileSeries.find((p) => p.id === selectedProfileId);
    if (!profile) {
      return { glassPieces: [], glassAreaSqm: 0 };
    }

    const compartmentWidthMm = width / sashCount;
    const compartmentHeightMm = height;

    // Calculate glass dimensions for each sash that uses glass
    const glassSizes: Array<{ width_mm: number; height_mm: number }> = [];
    
    sashes.forEach((sash) => {
      if (sash.fillType === 'glass') {
        // Apply glass deductions from profile series
        const gw = Math.max(0, compartmentWidthMm - profile.glass_width_deduction_mm);
        const gh = Math.max(0, compartmentHeightMm - profile.glass_height_deduction_mm);
        glassSizes.push({ width_mm: gw, height_mm: gh });
      }
    });

    // Group identical sizes
    const grouped: Map<string, GlassPiece> = new Map();
    glassSizes.forEach((size) => {
      const key = `${size.width_mm.toFixed(1)}x${size.height_mm.toFixed(1)}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.quantity += 1;
      } else {
        grouped.set(key, {
          width_mm: size.width_mm,
          height_mm: size.height_mm,
          quantity: 1,
        });
      }
    });

    const pieces = Array.from(grouped.values());

    // Calculate total glass area in square meters
    const totalArea = pieces.reduce(
      (sum, piece) => sum + (piece.width_mm / 1000) * (piece.height_mm / 1000) * piece.quantity,
      0
    );

    return { glassPieces: pieces, glassAreaSqm: totalArea };
  }, [width, height, sashCount, sashes, selectedProfileId, settings.profileSeries]);

  // Derived pricing values for commercial dashboard
  const baseMaterialsCost = calculatedPrice;
  const laborCost =
    baseMaterialsCost > 0 ? (baseMaterialsCost * settings.defaultLaborPercentage) / 100 : 0;
  const baseCost = baseMaterialsCost + laborCost;

  const priceWithMarkup =
    baseCost > 0 ? baseCost * (1 + (markupPercent || 0) / 100) + (markupFixed || 0) : 0;
  const discountPercentAmount = priceWithMarkup > 0 ? (priceWithMarkup * (discountPercent || 0) / 100) : 0;
  const totalDiscount = discountPercentAmount + (discountFixed || 0);
  const sellingPrice = Math.max(priceWithMarkup - totalDiscount, 0);
  const finalPriceWithVAT = sellingPrice * 1.19;
  const vatAmount = finalPriceWithVAT - sellingPrice;
  const markupAmount = priceWithMarkup - baseCost;

  // Update sashes when sash count changes
  useEffect(() => {
    const newSashes: SashConfig[] = [];
    for (let i = 0; i < sashCount; i++) {
      if (sashes[i]) {
        newSashes.push(sashes[i]);
      } else {
        newSashes.push({ id: `${i + 1}`, openingType: 'fixed', fillType: 'glass' });
      }
    }
    setSashes(newSashes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sashCount]);

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    if (type === 'door') {
      setWidth(900);
      setHeight(2000);
    } else if (type === 'window') {
      setWidth(1000);
      setHeight(1200);
    }
    // "other" currently behaves like window but keeps current dimensions
  };

  // Notify parent of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        width,
        height,
        selectedProfileId,
        selectedGlassId,
        selectedHardwareId,
        selectedColor,
        sashCount,
        sashes,
        calculatedPrice,
        productType,
        baseCost,
        markupPercent,
        markupFixed,
        discountPercent,
        discountFixed,
        sellingPrice,
        vatAmount,
        finalPriceWithVAT,
        glassPieces,
        glassAreaSqm,
        profileLengthMeters,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    selectedProfileId,
    selectedGlassId,
    selectedHardwareId,
    selectedColor,
    sashCount,
    sashes,
    calculatedPrice,
    productType,
    baseCost,
    glassPieces,
    glassAreaSqm,
    profileLengthMeters,
    markupPercent,
    markupFixed,
    discountPercent,
    discountFixed,
    sellingPrice,
    vatAmount,
    finalPriceWithVAT,
  ]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setWidth(0);
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      setWidth(numValue);
    }
  };

  const handleWidthBlur = () => {
    const clampedValue = Math.min(Math.max(width || MIN_DIMENSION, MIN_DIMENSION), MAX_DIMENSION);
    setWidth(clampedValue);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setHeight(0);
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      setHeight(numValue);
    }
  };

  const handleHeightBlur = () => {
    const clampedValue = Math.min(Math.max(height || MIN_DIMENSION, MIN_DIMENSION), MAX_DIMENSION);
    setHeight(clampedValue);
  };

  const handleSashOpeningTypeChange = (sashId: string, openingType: OpeningType) => {
    setSashes((prev) =>
      prev.map((sash) => (sash.id === sashId ? { ...sash, openingType } : sash))
    );
  };

  const handleSashFillTypeChange = (sashId: string, fillType: 'glass' | 'panel') => {
    setSashes((prev) =>
      prev.map((sash) => (sash.id === sashId ? { ...sash, fillType } : sash))
    );
  };

  // Get available colors from profile series
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    settings.profileSeries.forEach((profile) => {
      if (profile.colorCategory) {
        colors.add(profile.colorCategory);
      }
    });
    return Array.from(colors);
  }, [settings.profileSeries]);


  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {productType === 'door'
            ? 'Configurare Ușă'
            : 'Configurare Fereastră'}
        </h2>

        {/* Product Type Selector */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-gray-700">Tip Produs:</span>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {[
              { type: 'window' as ProductType, label: 'Fereastră' },
              { type: 'door' as ProductType, label: 'Ușă' },
              { type: 'other' as ProductType, label: 'Altele' },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleProductTypeChange(opt.type)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  productType === opt.type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lățime (mm)
            </label>
            <input
              type="number"
              value={width}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Min: {MIN_DIMENSION}mm, Max: {MAX_DIMENSION}mm</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Înălțime (mm)
            </label>
            <input
              type="number"
              value={height}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Min: {MIN_DIMENSION}mm, Max: {MAX_DIMENSION}mm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seria de Profil
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Selectează profil...</option>
              {settings.profileSeries.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.chambers} camere) - {profile.pricePerMeter} RON/m
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip Geam
            </label>
            <select
              value={selectedGlassId}
              onChange={(e) => setSelectedGlassId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Selectează geam...</option>
              {settings.glassTypes.map((glass) => (
                <option key={glass.id} value={glass.id}>
                  {glass.name} - {glass.pricePerSqMeter} RON/m²
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feronerie
            </label>
            <select
              value={selectedHardwareId}
              onChange={(e) => setSelectedHardwareId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Selectează feronerie...</option>
              {settings.hardwareOptions.map((hardware) => (
                <option key={hardware.id} value={hardware.id}>
                  {hardware.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culoare
            </label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">Selectează culoare...</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Număr Compartimente (Sash)
          </label>
          <div className="flex gap-4">
            {([1, 2, 3] as const).map((count) => (
              <button
                key={count}
                onClick={() => setSashCount(count)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  sashCount === count
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {count} {count === 1 ? 'compartiment' : 'compartimente'}
              </button>
            ))}
          </div>
        </div>

        {/* Sash Opening Type Selectors */}
        {sashCount > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tip Deschidere per Compartiment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sashes.map((sash, index) => (
                <div key={sash.id} className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Compartiment {index + 1}
                  </label>
                  <div className="space-y-2">
                  <select
                    value={sash.openingType}
                    onChange={(e) =>
                      handleSashOpeningTypeChange(sash.id, e.target.value as OpeningType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="fixed">Fix</option>
                    <option value="turn">Deschidere</option>
                    <option value="tilt-turn">Oscilobatant</option>
                  </select>
                    <select
                      value={sash.fillType}
                      onChange={(e) =>
                        handleSashFillTypeChange(sash.id, e.target.value as 'glass' | 'panel')
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="glass">Umplutură: Sticlă</option>
                      <option value="panel">Umplutură: Panel PVC</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sashCount === 1 && sashes[0] && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip Deschidere
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={sashes[0].openingType}
                onChange={(e) =>
                  handleSashOpeningTypeChange(sashes[0].id, e.target.value as OpeningType)
                }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixed">Fix</option>
              <option value="turn">Deschidere</option>
              <option value="tilt-turn">Oscilobatant</option>
            </select>
              <select
                value={sashes[0].fillType}
                onChange={(e) =>
                  handleSashFillTypeChange(sashes[0].id, e.target.value as 'glass' | 'panel')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="glass">Umplutură: Sticlă</option>
                <option value="panel">Umplutură: Panel PVC</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Preview and Price Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Previzualizare</h2>
          <WindowPreview
            width={width}
            height={height}
            productType={productType}
            sashCount={sashCount}
            sashes={sashes}
          />
        </div>

        {!hidePricing && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Calcul Preț</h2>
            <div className="space-y-6">
              {selectedProfileId && selectedGlassId && selectedHardwareId ? (
                <>
                  {/* Section 1: Build Cost */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Cost Producție</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>Profil:</span>
                        <span>{profileCost.toFixed(2)} RON</span>
                      </div>
                      {selectedProfileId && profileLengthMeters > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 italic">
                          <span>Profil necesar:</span>
                          <span>
                            {profileLengthMeters.toFixed(3)} ml [
                            {settings.profileSeries.find((p) => p.id === selectedProfileId)?.name || 'N/A'}]
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Geam:</span>
                        <span>{glassCost.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Feronerie:</span>
                        <span>{hardwareCost.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manoperă ({settings.defaultLaborPercentage}%):</span>
                        <span>{laborCost.toFixed(2)} RON</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-700">Total Cost Materiale:</span>
                        <span className="text-xl font-bold text-blue-700">
                          {baseCost.toFixed(2)} RON
                      </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Price Change Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Modificări Preț</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Adaos Comercial (%)
                        </label>
                        <input
                          type="number"
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Adaos Comercial Fix (RON)
                        </label>
                        <input
                          type="number"
                          value={markupFixed}
                          onChange={(e) => setMarkupFixed(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setDiscountPercent(Math.min(Math.max(value, 0), 100));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount Fix (RON)
                        </label>
                        <input
                          type="number"
                          value={discountFixed}
                          onChange={(e) => setDiscountFixed(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Total Price Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Detalii Preț</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span>Preț Materiale:</span>
                        <span>{baseCost.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Adaos:</span>
                        <span>{markupAmount.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{totalDiscount.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                        <span className="font-medium">Preț Fără TVA:</span>
                        <span className="font-semibold">{sellingPrice.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (19%):</span>
                        <span>{vatAmount.toFixed(2)} RON</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Total Cost (Highlighted) */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">TOTAL DE PLATĂ:</span>
                      <span className="text-3xl font-extrabold text-blue-700">
                        {finalPriceWithVAT.toFixed(2)} RON
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-700">
                    Selectează profil, geam și feronerie pentru a calcula prețul
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Simple estimate when pricing is hidden */}
        {hidePricing && selectedProfileId && selectedGlassId && selectedHardwareId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Estimat:</p>
            <p className="text-2xl font-bold text-blue-700">{baseCost.toFixed(2)} RON</p>
            <p className="text-xs text-gray-500 mt-1">Prețul final va fi calculat în Preț & Export</p>
          </div>
        )}
      </div>
    </div>
  );
}
