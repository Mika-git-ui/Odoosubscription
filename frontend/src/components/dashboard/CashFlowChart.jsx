import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Cash Flow Graph Component
 * Recreates the purple area graph with gradient fill matching the reference screenshot.
 * Features:
 * - Smooth bezier curve in #7952CC
 * - Soft purple gradient fill under the curve
 * - Horizontal grid lines (0, 20, 40, 60, 80)
 * - Monthly X-Axis labels (Jan - Dec)
 * - Interactive hover tooltips with INR (₹) formatting
 */
export const CashFlowChart = ({ data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Normalized points mapped to Y-scale (0 to 80)
  const defaultPoints = [
    { label: 'Jan', val: 42, amount: 420000 },
    { label: 'Feb', val: 46, amount: 460000 },
    { label: 'Mar', val: 44, amount: 440000 },
    { label: 'Apr', val: 48, amount: 480000 },
    { label: 'May', val: 46, amount: 460000 },
    { label: 'Jun', val: 51, amount: 510000 },
    { label: 'Jul', val: 49, amount: 490000 },
    { label: 'Aug', val: 54, amount: 540000 },
    { label: 'Sep', val: 58, amount: 580000 },
    { label: 'Oct', val: 57, amount: 570000 },
    { label: 'Nov', val: 62, amount: 620000 },
    { label: 'Dec', val: 65, amount: 650000 },
  ];

  const points = data.length > 0 ? data : defaultPoints;

  // Viewbox dimensions
  const width = 640;
  const height = 220;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Convert points to SVG coordinates
  const coords = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (p.val / 80) * chartHeight;
    return { ...p, x, y };
  });

  // Build smooth bezier SVG path
  const buildSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;

  const yTicks = [0, 20, 40, 60, 80];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7952CC" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#7952CC" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal subtle grid lines */}
        {yTicks.map((tick) => {
          const yPos = paddingTop + chartHeight - (tick / 80) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="var(--border-default)"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={yPos + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9CA3AF"
                fontFamily="Inter, sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Purple Area Gradient Fill */}
        <path d={areaPath} fill="url(#purpleGradient)" />

        {/* Purple Smooth Line Stroke */}
        <path d={linePath} fill="none" stroke="#7952CC" strokeWidth="2.5" strokeLinecap="round" />

        {/* X-Axis Monthly Labels */}
        {coords.map((pt, idx) => (
          <text
            key={idx}
            x={pt.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#9CA3AF"
            fontFamily="Inter, sans-serif"
          >
            {pt.label}
          </text>
        ))}

        {/* Interactive Hover Hotspots & Circles */}
        {coords.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.label === pt.label ? 5 : 0}
              fill="#7952CC"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <rect
              x={pt.x - 18}
              y={paddingTop}
              width="36"
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
        ))}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 32}%`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#111827',
            color: '#FFFFFF',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}
        >
          <div>{hoveredPoint.label}: {formatCurrency(hoveredPoint.amount)}</div>
        </div>
      )}
    </div>
  );
};

export default CashFlowChart;
