import { OpeningType } from '../../types';

const SVG_SCALE = 0.3;
const PADDING = 60;
const PROFILE_WIDTH = 40;
const DIMENSION_LINE_OFFSET = 20;

interface SashConfig {
  id: string;
  openingType: OpeningType;
  fillType: 'glass' | 'panel';
}

interface WindowPreviewProps {
  width: number;
  height: number;
  productType: 'window' | 'door' | 'other';
  sashCount: 1 | 2 | 3;
  sashes: SashConfig[];
}

export default function WindowPreview({
  width,
  height,
  productType,
  sashCount,
  sashes,
}: WindowPreviewProps) {
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

    // 1. Outer Frame
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

    // Door threshold representation
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

    // 2. Mullions (Vertical dividers)
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

    // 3. Sashes and Glass / Panel
    sashes.forEach((sash, index) => {
      const sashX = frameX + index * sashWidth;
      const sashActualWidth = sashWidth;
      const isPanel = sash.fillType === 'panel';

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

        // Inner sash frame
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
        const handleSide = sashInnerX + sashInnerWidth;
        const hingeSide = sashInnerX;
        const sashCenterY = sashInnerY + sashInnerHeight / 2;

        if (sash.openingType === 'turn' || sash.openingType === 'tilt-turn') {
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

        // Handle
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

        // Hinges
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
        <line
          x1={dimLineX}
          y1={dimLineStartY - dimLineExtension}
          x2={dimLineX}
          y2={dimLineEndY + dimLineExtension}
          stroke="#6b7280"
          strokeWidth="1"
        />
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
        <line
          x1={dimLineStartX - dimLineExtension}
          y1={dimLineY}
          x2={dimLineEndX + dimLineExtension}
          y2={dimLineY}
          stroke="#6b7280"
          strokeWidth="1"
        />
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
  );
}


