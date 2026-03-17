"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UILegitimacyDimensionOutcome } from "@/lib/mappers/collective";

interface LegitimacyRadarProps {
  readonly dimensions: readonly UILegitimacyDimensionOutcome[];
}

/**
 * Pure SVG pentagon radar chart for the 5 legitimacy dimensions.
 * No external charting library.
 */
export function LegitimacyRadar({ dimensions }: LegitimacyRadarProps) {
  const cx = 150;
  const cy = 150;
  const radius = 110;
  const labelRadius = 135;
  const n = dimensions.length;

  if (n === 0) return null;

  // Compute vertex positions. Start from top (-90 degrees).
  function vertexPosition(index: number, r: number): [number, number] {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Background rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = dimensions.map((dim, i) => vertexPosition(i, radius * dim.score));
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  // Outer polygon (100% ring)
  const outerPoints = Array.from({ length: n }, (_, i) => vertexPosition(i, radius));
  const outerPolygon = outerPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <TooltipProvider>
      <svg
        viewBox="0 0 300 300"
        className="w-full max-w-[320px] h-auto"
        role="img"
        aria-label="Legitimacy radar chart"
      >
        {/* Background rings */}
        {rings.map((pct) => {
          const pts = Array.from({ length: n }, (_, i) => vertexPosition(i, radius * pct));
          return (
            <polygon
              key={pct}
              points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="#384656"
              strokeWidth={0.5}
              opacity={0.5}
            />
          );
        })}

        {/* Axis lines from center to each vertex */}
        {outerPoints.map(([x, y], i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#384656"
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {/* Outer boundary */}
        <polygon
          points={outerPolygon}
          fill="none"
          stroke="#384656"
          strokeWidth={1}
        />

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(102, 252, 241, 0.15)"
          stroke="#66FCF1"
          strokeWidth={1.5}
        />

        {/* Data points (circles) with tooltips */}
        {dimensions.map((dim, i) => {
          const [x, y] = dataPoints[i];
          return (
            <Tooltip key={dim.dimension}>
              <TooltipTrigger asChild>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#66FCF1"
                  stroke="#0B0C10"
                  strokeWidth={1.5}
                  className="cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent className="bg-[#0B0C10] border-[#384656] text-[#C5C6C7] p-2 text-xs space-y-1">
                <p className="font-semibold">{dim.dimensionLabel}</p>
                <p className="font-mono">{dim.scorePercent}%</p>
                <p className="text-[#C5C6C7]/60">{dim.disposition}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Dimension labels */}
        {dimensions.map((dim, i) => {
          const [lx, ly] = vertexPosition(i, labelRadius);
          return (
            <text
              key={`label-${dim.dimension}`}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[#C5C6C7] text-[9px] font-mono"
            >
              {dim.dimensionLabel}
            </text>
          );
        })}
      </svg>
    </TooltipProvider>
  );
}
