import { useConfiguratorStore } from '../../store/userConfiguratorStore';
import { OpeningType, FillingType } from '../../types/configurator';

const PROFILE_WIDTH = 40;
const DIMENSION_LINE_OFFSET = 50;
const DIMENSION_TEXT_OFFSET = 15;

interface WindowVisualizerProps {
  /** Callback when a cell is clicked */
  onCellClick?: (cellId: string) => void;
}

/**
 * Calculate cell dimensions and positions based on grid
 */
interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

function calculateCellPositions(
  totalWidth: number,
  totalHeight: number,
  mullions: number,
  transoms: number
): CellPosition[] {
  const positions: CellPosition[] = [];
  
  // Calculate cell dimensions
  const cellWidth = (totalWidth - (mullions * PROFILE_WIDTH)) / (mullions + 1);
  const cellHeight = (totalHeight - (transoms * PROFILE_WIDTH)) / (transoms + 1);
  
  const rows = transoms + 1;
  const cols = mullions + 1;
  
  // Calculate positions for each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (cellWidth + PROFILE_WIDTH);
      const y = row * (cellHeight + PROFILE_WIDTH);
      
      positions.push({
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        row,
        col,
      });
    }
  }
  
  return positions;
}

/**
 * Render opening symbol based on opening type
 * Triangle points to the handle side
 */
function renderOpeningSymbol(
  x: number,
  y: number,
  width: number,
  height: number,
  openingType: OpeningType,
  _hasHandle: boolean // Reserved for future use (e.g., handle position indicator)
): JSX.Element | null {
  if (openingType === OpeningType.FIXED) {
    return null;
  }

  // Center point of the cell
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Size of the triangle
  const triangleSize = Math.min(width, height) * 0.15;
  
  let points: string;
  let fillColor: string;
  
  switch (openingType) {
    case OpeningType.TURN_LEFT:
      // Triangle pointing left (handle on left)
      points = `${centerX - triangleSize},${centerY} ${centerX},${centerY - triangleSize} ${centerX},${centerY + triangleSize}`;
      fillColor = '#3b82f6';
      break;
      
    case OpeningType.TURN_RIGHT:
      // Triangle pointing right (handle on right)
      points = `${centerX + triangleSize},${centerY} ${centerX},${centerY - triangleSize} ${centerX},${centerY + triangleSize}`;
      fillColor = '#3b82f6';
      break;
      
    case OpeningType.TILT_TURN:
      // Triangle pointing up-right (oscillating)
      points = `${centerX},${centerY - triangleSize} ${centerX + triangleSize},${centerY + triangleSize} ${centerX - triangleSize},${centerY + triangleSize}`;
      fillColor = '#10b981';
      break;
      
    case OpeningType.TILT:
      // Triangle pointing up (tilt only)
      points = `${centerX},${centerY - triangleSize} ${centerX - triangleSize},${centerY + triangleSize} ${centerX + triangleSize},${centerY + triangleSize}`;
      fillColor = '#10b981';
      break;
      
    case OpeningType.SLIDING:
      // Horizontal arrows for sliding
      return (
        <g key="sliding-symbol">
          <line
            x1={centerX - triangleSize}
            y1={centerY}
            x2={centerX + triangleSize}
            y2={centerY}
            stroke="#8b5cf6"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <line
            x1={centerX - triangleSize * 0.5}
            y1={centerY - triangleSize * 0.3}
            x2={centerX + triangleSize * 0.5}
            y2={centerY - triangleSize * 0.3}
            stroke="#8b5cf6"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />
        </g>
      );
      
    default:
      return null;
  }
  
  return (
    <polygon
      points={points}
      fill={fillColor}
      stroke="#1e40af"
      strokeWidth="1"
      opacity={0.8}
    />
  );
}

/**
 * Render dimension lines with text
 */
function renderDimensionLines(
  totalWidth: number,
  totalHeight: number
): JSX.Element[] {
  const elements: JSX.Element[] = [];
  
  // Top dimension line (width)
  const topLineY = -DIMENSION_LINE_OFFSET;
  const topTextY = topLineY - DIMENSION_TEXT_OFFSET;
  
  // Horizontal dimension line
  elements.push(
    <line
      key="dim-width-line"
      x1={0}
      y1={topLineY}
      x2={totalWidth}
      y2={topLineY}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  
  // Vertical tick marks
  elements.push(
    <line
      key="dim-width-tick-start"
      x1={0}
      y1={topLineY - 5}
      x2={0}
      y2={topLineY + 5}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  elements.push(
    <line
      key="dim-width-tick-end"
      x1={totalWidth}
      y1={topLineY - 5}
      x2={totalWidth}
      y2={topLineY + 5}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  
  // Width text
  elements.push(
    <text
      key="dim-width-text"
      x={totalWidth / 2}
      y={topTextY}
      textAnchor="middle"
      fontSize="12"
      fill="#374151"
      fontWeight="500"
    >
      {totalWidth}mm
    </text>
  );
  
  // Left dimension line (height)
  const leftLineX = -DIMENSION_LINE_OFFSET;
  const leftTextX = leftLineX - DIMENSION_TEXT_OFFSET;
  
  // Vertical dimension line
  elements.push(
    <line
      key="dim-height-line"
      x1={leftLineX}
      y1={0}
      x2={leftLineX}
      y2={totalHeight}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  
  // Horizontal tick marks
  elements.push(
    <line
      key="dim-height-tick-start"
      x1={leftLineX - 5}
      y1={0}
      x2={leftLineX + 5}
      y2={0}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  elements.push(
    <line
      key="dim-height-tick-end"
      x1={leftLineX - 5}
      y1={totalHeight}
      x2={leftLineX + 5}
      y2={totalHeight}
      stroke="#374151"
      strokeWidth="1"
    />
  );
  
  // Height text (rotated)
  elements.push(
    <text
      key="dim-height-text"
      x={leftTextX}
      y={totalHeight / 2}
      textAnchor="middle"
      fontSize="12"
      fill="#374151"
      fontWeight="500"
      transform={`rotate(-90 ${leftTextX} ${totalHeight / 2})`}
    >
      {totalHeight}mm
    </text>
  );
  
  return elements;
}

export default function WindowVisualizer({ onCellClick }: WindowVisualizerProps) {
  const { activeConfig } = useConfiguratorStore();
  
  if (!activeConfig) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">Selectați un template pentru a vedea previzualizarea</p>
      </div>
    );
  }
  
  const { width, height, grid, cells, type } = activeConfig;
  const { mullions, transoms } = grid;
  
  // Calculate cell positions
  const cellPositions = calculateCellPositions(width, height, mullions, transoms);
  
  // Calculate SVG viewBox with padding for dimension lines
  const padding = DIMENSION_LINE_OFFSET + DIMENSION_TEXT_OFFSET;
  const viewBoxX = -padding;
  const viewBoxY = -padding;
  const viewBoxWidth = width + padding * 2;
  const viewBoxHeight = height + padding * 2;
  
  // Glass gradient definition
  const glassGradientId = 'glass-gradient';
  
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4 overflow-auto">
      <svg
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Definitions */}
        <defs>
          {/* Glass gradient */}
          <linearGradient id={glassGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          
          {/* Arrow marker for sliding symbol */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
          </marker>
        </defs>
        
        {/* Layer 1: Dimension Lines */}
        {renderDimensionLines(width, height)}
        
        {/* Layer 2: Outer Frame */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#ffffff"
          stroke="#1f2937"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        
        {/* Double-line effect for frame depth */}
        <rect
          x={2}
          y={2}
          width={width - 4}
          height={height - 4}
          fill="none"
          stroke="#4b5563"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Door threshold (if door type) */}
        {type === 'door' && (
          <rect
            x={0}
            y={height - PROFILE_WIDTH / 3}
            width={width}
            height={PROFILE_WIDTH / 3}
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth="1"
          />
        )}
        
        {/* Layer 3: Mullions (Vertical Dividers) */}
        {mullions > 0 && (() => {
          const cellWidth = (width - (mullions * PROFILE_WIDTH)) / (mullions + 1);
          return Array.from({ length: mullions }, (_, i) => {
            // Mullion i is positioned after column i
            const mullionX = (i + 1) * (cellWidth + PROFILE_WIDTH) - PROFILE_WIDTH / 2;
            return (
              <rect
                key={`mullion-${i}`}
                x={mullionX}
                y={0}
                width={PROFILE_WIDTH}
                height={height}
                fill="#e5e7eb"
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          });
        })()}
        
        {/* Layer 4: Transoms (Horizontal Dividers) */}
        {transoms > 0 && (() => {
          const cellHeight = (height - (transoms * PROFILE_WIDTH)) / (transoms + 1);
          return Array.from({ length: transoms }, (_, i) => {
            // Transom i is positioned after row i
            const transomY = (i + 1) * (cellHeight + PROFILE_WIDTH) - PROFILE_WIDTH / 2;
            return (
              <rect
                key={`transom-${i}`}
                x={0}
                y={transomY}
                width={width}
                height={PROFILE_WIDTH}
                fill="#e5e7eb"
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          });
        })()}
        
        {/* Layer 5: Cells with Fill */}
        {cellPositions.map((pos, index) => {
          const cell = cells[index];
          if (!cell) return null;
          
          const cellInnerX = pos.x + PROFILE_WIDTH / 2;
          const cellInnerY = pos.y + PROFILE_WIDTH / 2;
          const cellInnerWidth = pos.width - PROFILE_WIDTH;
          const cellInnerHeight = pos.height - PROFILE_WIDTH;
          
          // Determine fill based on filling type
          const isGlass = cell.fillingType === FillingType.GLASS;
          const fill = isGlass ? `url(#${glassGradientId})` : '#ffffff';
          const stroke = isGlass ? 'none' : '#d1d5db';
          const strokeWidth = isGlass ? 0 : 1;
          
          return (
            <g
              key={`cell-group-${cell.id}`}
              onClick={() => onCellClick?.(cell.id)}
              className="cursor-pointer"
              style={{ pointerEvents: 'all' }}
            >
              {/* Cell fill */}
              <rect
                x={cellInnerX}
                y={cellInnerY}
                width={cellInnerWidth}
                height={cellInnerHeight}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                className="hover:opacity-80 transition-opacity"
              />
              
              {/* Panel hatch pattern (if panel) */}
              {!isGlass && (
                <line
                  x1={cellInnerX}
                  y1={cellInnerY}
                  x2={cellInnerX + cellInnerWidth}
                  y2={cellInnerY + cellInnerHeight}
                  stroke="#d1d5db"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              )}
              
              {/* Layer 6: Opening Symbols */}
              {renderOpeningSymbol(
                cellInnerX,
                cellInnerY,
                cellInnerWidth,
                cellInnerHeight,
                cell.openingType,
                cell.hasHandle
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

