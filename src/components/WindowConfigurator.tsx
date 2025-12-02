import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { OpeningType } from '../types';

type ProductType = 'window' | 'door' | 'other';

const SVG_SCALE = 0.3;
const PADDING = 60; // Increased for dimension lines
const MIN_DIMENSION = 400;
const MAX_DIMENSION = 2500;
const PROFILE_WIDTH = 40; // Profile width in SVG pixels
const DIMENSION_LINE_OFFSET = 20; // Offset for dimension lines

interface SashConfig {
  id: string;
  openingType: OpeningType;
  fillType: 'glass' | 'panel';
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
}

interface WindowConfiguratorProps {
  onConfigChange?: (config: WindowConfigData) => void;
}

export default function WindowConfigurator({ onConfigChange }: WindowConfiguratorProps) {
  const { settings } = useStore();

  // Window dimensions
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1200);

  // Product type
  const [productType, setProductType] = useState<ProductType>('window');

  // Configuration selections
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedGlassId, setSelectedGlassId] = useState<string>('');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sashCount, setSashCount] = useState<1 | 2 | 3>(1);

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

  // Calculate individual material costs for breakdown
  const profileCost = useMemo(() => {
    if (!selectedProfileId) return 0;
    const profile = settings.profileSeries.find((p) => p.id === selectedProfileId);
    if (!profile) return 0;
    const perimeterMeters = ((width * 2 + height * 2) / 1000);
    return perimeterMeters * profile.pricePerMeter;
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

  // SVG calculations
  const svgWidth = width * SVG_SCALE + PADDING * 2 + DIMENSION_LINE_OFFSET * 2;
  const svgHeight = height * SVG_SCALE + PADDING * 2 + DIMENSION_LINE_OFFSET * 2;
  const frameX = PADDING + DIMENSION_LINE_OFFSET;
  const frameY = PADDING + DIMENSION_LINE_OFFSET;
  const frameWidth = width * SVG_SCALE;
  const frameHeight = height * SVG_SCALE;

  // Calculate sash positions for vertical division
  const sashWidth = sashCount > 1 ? frameWidth / sashCount : frameWidth;

  // Render architectural window preview
  const renderArchitecturalWindow = () => {
    const elements: JSX.Element[] = [];

    // 1. Outer Frame (Main rectangle with white fill and gray stroke)
    elements.push(
      <rect
        key="outer-frame"
        x={frameX}
        y={frameY}
        width={frameWidth}
        height={frameHeight}
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth="2"
      />
    );

    // Door threshold representation (aluminum threshold at the bottom)
    if (productType === 'door') {
      const thresholdHeight = PROFILE_WIDTH / 3;
      elements.push(
        <rect
          key="door-threshold"
          x={frameX + 1}
          y={frameY + frameHeight - thresholdHeight}
          width={frameWidth - 2}
          height={thresholdHeight}
          fill="#e5e7eb"
          stroke="#9ca3af"
          strokeWidth="1"
        />
      );
    }

    // 2. Mullions (Vertical dividers as rectangles)
    if (sashCount > 1) {
      for (let i = 1; i < sashCount; i++) {
        const mullionX = frameX + i * sashWidth - PROFILE_WIDTH / 2;
        elements.push(
          <rect
            key={`mullion-${i}`}
            x={mullionX}
            y={frameY}
            width={PROFILE_WIDTH}
            height={frameHeight}
            fill="#e5e7eb"
            stroke="#6b7280"
            strokeWidth="1"
          />
        );
      }
    }

    // 3. Sashes (Inner rectangles for opening windows) and Glass / Panel
    sashes.forEach((sash, index) => {
      const sashX = frameX + index * sashWidth;
      const sashActualWidth = sashWidth;

      const isPanel = sash.fillType === 'panel';

      // Glass area (innermost)
      if (sash.openingType === 'fixed') {
        // Fixed window - glass fills the entire sash area
        elements.push(
          <rect
            key={`glass-fixed-${index}`}
            x={sashX + PROFILE_WIDTH / 2}
            y={frameY + PROFILE_WIDTH / 2}
            width={sashActualWidth - PROFILE_WIDTH}
            height={frameHeight - PROFILE_WIDTH}
            fill={isPanel ? '#ffffff' : '#e0f2fe'}
            stroke={isPanel ? '#9ca3af' : 'none'}
            strokeWidth={isPanel ? 1 : 0}
          />
        );

        if (isPanel) {
          elements.push(
            <line
              key={`panel-fixed-hatch-${index}`}
              x1={sashX + PROFILE_WIDTH / 2}
              y1={frameY + PROFILE_WIDTH / 2}
              x2={sashX + sashActualWidth - PROFILE_WIDTH / 2}
              y2={frameY + frameHeight - PROFILE_WIDTH / 2}
              stroke="#d1d5db"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        }
      } else {
        // Opening window - draw inner sash rectangle
        const sashInnerX = sashX + PROFILE_WIDTH / 2;
        const sashInnerY = frameY + PROFILE_WIDTH / 2;
        const sashInnerWidth = sashActualWidth - PROFILE_WIDTH;
        const sashInnerHeight = frameHeight - PROFILE_WIDTH;

        // Inner sash frame (the opening part)
        elements.push(
          <rect
            key={`sash-frame-${index}`}
            x={sashInnerX}
            y={sashInnerY}
            width={sashInnerWidth}
            height={sashInnerHeight}
            fill="#ffffff"
            stroke="#4b5563"
            strokeWidth="1.5"
          />
        );

        // Glass / Panel inside the sash
        const glassX = sashInnerX + PROFILE_WIDTH / 4;
        const glassY = sashInnerY + PROFILE_WIDTH / 4;
        const glassWidth = sashInnerWidth - PROFILE_WIDTH / 2;
        const glassHeight = sashInnerHeight - PROFILE_WIDTH / 2;

        elements.push(
          <rect
            key={`glass-${index}`}
            x={glassX}
            y={glassY}
            width={glassWidth}
            height={glassHeight}
            fill={isPanel ? '#ffffff' : '#e0f2fe'}
            stroke={isPanel ? '#9ca3af' : 'none'}
            strokeWidth={isPanel ? 1 : 0}
          />
        );

        if (isPanel) {
          elements.push(
            <line
              key={`panel-hatch-${index}`}
              x1={glassX}
              y1={glassY}
              x2={glassX + glassWidth}
              y2={glassY + glassHeight}
              stroke="#d1d5db"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        }

        // Opening triangles
        const handleSide = sashInnerX + sashInnerWidth; // Right side (handle)
        const hingeSide = sashInnerX; // Left side (hinge)
        const sashCenterY = sashInnerY + sashInnerHeight / 2;

        if (sash.openingType === 'turn' || sash.openingType === 'tilt-turn') {
          // Turn triangle: tip points to handle side, base on hinge side
          const triangleTipX = handleSide - PROFILE_WIDTH / 2;
          const triangleBaseX = hingeSide + PROFILE_WIDTH / 2;
          const triangleTopY = sashInnerY + PROFILE_WIDTH / 2;
          const triangleBottomY = sashInnerY + sashInnerHeight - PROFILE_WIDTH / 2;

          elements.push(
            <polyline
              key={`turn-triangle-${index}`}
              points={`${triangleBaseX},${triangleTopY} ${triangleTipX},${sashCenterY} ${triangleBaseX},${triangleBottomY}`}
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
            />
          );
        }

        if (sash.openingType === 'tilt-turn') {
          // Tilt triangle: base at bottom, tip at top center
          const triangleSize = Math.min(sashInnerWidth * 0.25, sashInnerHeight * 0.25);
          const sashCenterX = sashInnerX + sashInnerWidth / 2;
          const triangleTopY = sashInnerY + PROFILE_WIDTH / 2;
          const triangleBottomY = sashInnerY + sashInnerHeight - PROFILE_WIDTH / 2;
          const triangleLeftX = sashCenterX - triangleSize / 2;
          const triangleRightX = sashCenterX + triangleSize / 2;

          elements.push(
            <polyline
              key={`tilt-triangle-${index}`}
              points={`${triangleLeftX},${triangleBottomY} ${sashCenterX},${triangleTopY} ${triangleRightX},${triangleBottomY}`}
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
            />
          );
        }

        // Handle (L-shaped on handle side)
        const handleX = handleSide - PROFILE_WIDTH / 2;
        const handleY = sashCenterY;
        const handleSize = 8;
        elements.push(
          <g key={`handle-${index}`}>
            <line
              x1={handleX}
              y1={handleY - handleSize}
              x2={handleX}
              y2={handleY + handleSize}
              stroke="#1f2937"
              strokeWidth="2"
            />
            <line
              x1={handleX}
              y1={handleY}
              x2={handleX + handleSize}
              y2={handleY}
              stroke="#1f2937"
              strokeWidth="2"
            />
          </g>
        );

        // Hinges (small rectangles on hinge side)
        const hingeCount = 3;
        const hingeSpacing = sashInnerHeight / (hingeCount + 1);
        for (let h = 1; h <= hingeCount; h++) {
          const hingeY = sashInnerY + h * hingeSpacing;
          elements.push(
            <rect
              key={`hinge-${index}-${h}`}
              x={hingeSide + PROFILE_WIDTH / 4}
              y={hingeY - 3}
              width={6}
              height={6}
              fill="#1f2937"
              stroke="none"
            />
          );
        }
      }
    });

    // 4. Dimension Lines
    // Height dimension (left side)
    const dimLineX = frameX - DIMENSION_LINE_OFFSET;
    const dimLineStartY = frameY;
    const dimLineEndY = frameY + frameHeight;
    const dimLineExtension = 5;

    elements.push(
      <g key="height-dimension">
        {/* Extension lines */}
        <line
          x1={frameX}
          y1={dimLineStartY}
          x2={dimLineX}
          y2={dimLineStartY}
          stroke="#6b7280"
          strokeWidth="1"
        />
        <line
          x1={frameX}
          y1={dimLineEndY}
          x2={dimLineX}
          y2={dimLineEndY}
          stroke="#6b7280"
          strokeWidth="1"
        />
        {/* Main dimension line */}
        <line
          x1={dimLineX}
          y1={dimLineStartY - dimLineExtension}
          x2={dimLineX}
          y2={dimLineEndY + dimLineExtension}
          stroke="#6b7280"
          strokeWidth="1"
        />
        {/* Dimension text */}
        <text
          x={dimLineX - 5}
          y={(dimLineStartY + dimLineEndY) / 2}
          textAnchor="end"
          fill="#374151"
          fontSize="11"
          dominantBaseline="middle"
        >
          {height}
        </text>
      </g>
    );

    // Width dimension (top side)
    const dimLineStartX = frameX;
    const dimLineEndX = frameX + frameWidth;
    const dimLineY = frameY - DIMENSION_LINE_OFFSET;

    elements.push(
      <g key="width-dimension">
        {/* Extension lines */}
        <line
          x1={dimLineStartX}
          y1={frameY}
          x2={dimLineStartX}
          y2={dimLineY}
          stroke="#6b7280"
          strokeWidth="1"
        />
        <line
          x1={dimLineEndX}
          y1={frameY}
          x2={dimLineEndX}
          y2={dimLineY}
          stroke="#6b7280"
          strokeWidth="1"
        />
        {/* Main dimension line */}
        <line
          x1={dimLineStartX - dimLineExtension}
          y1={dimLineY}
          x2={dimLineEndX + dimLineExtension}
          y2={dimLineY}
          stroke="#6b7280"
          strokeWidth="1"
        />
        {/* Dimension text */}
        <text
          x={(dimLineStartX + dimLineEndX) / 2}
          y={dimLineY - 5}
          textAnchor="middle"
          fill="#374151"
          fontSize="11"
        >
          {width}
        </text>
      </g>
    );

    return elements;
  };

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

        <div className="grid grid-cols-2 gap-6 mb-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Min: {MIN_DIMENSION}mm, Max: {MAX_DIMENSION}mm</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seria de Profil
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feronerie
            </label>
            <select
              value={selectedHardwareId}
              onChange={(e) => setSelectedHardwareId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="grid grid-cols-3 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Previzualizare</h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-600 mb-3 font-medium">PREVIZUALIZARE</p>
            <div className="flex justify-center overflow-auto">
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="border border-gray-300 bg-white"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {renderArchitecturalWindow()}
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Calcul Preț</h2>
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
      </div>
    </div>
  );
}
