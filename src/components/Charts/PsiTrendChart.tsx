import React, { useState } from 'react';
import { HourlyTrendPoint, RegionId } from '../../types/psi';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

interface PsiTrendChartProps {
  trend: HourlyTrendPoint[];
  selectedRegion: RegionId;
  onSelectRegion: (reg: RegionId) => void;
}

export const PsiTrendChart: React.FC<PsiTrendChartProps> = ({
  trend,
  selectedRegion,
  onSelectRegion,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!trend || trend.length === 0) return null;

  // Chart dimensions
  const width = 840;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Get max PSI across dataset to scale Y axis (with minimum ceiling of 120)
  const maxPsi = Math.max(
    120,
    ...trend.map((t) => Math.max(t.national, t.north, t.south, t.east, t.west, t.central))
  );

  const getY = (val: number) => {
    return padding.top + graphHeight - (val / maxPsi) * graphHeight;
  };

  const getX = (idx: number) => {
    return padding.left + (idx / (trend.length - 1)) * graphWidth;
  };

  // Generate path string for selected region
  const regionKey: Exclude<RegionId, 'national'> | 'national' = selectedRegion;
  const points = trend.map((t, idx) => ({
    x: getX(idx),
    y: getY(t[regionKey] ?? t.national),
    val: t[regionKey] ?? t.national,
    pm25: t.pm25,
    hour: t.hour,
  }));

  const lineD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
  }, '');

  const areaD = `${lineD} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`;

  // Active hover point
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>24-Hour Diurnal PSI &amp; PM2.5 Trajectory</span>
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">
            Hourly Observation Curve &amp; Dispersion Analysis
          </div>
        </div>

        {/* Region Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
          {(['national', 'north', 'south', 'east', 'west', 'central'] as RegionId[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onSelectRegion(r)}
              className={`px-2.5 py-1 rounded transition-colors capitalize ${
                selectedRegion === r
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'national' ? 'SG Total' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 text-xs font-mono border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">TIMESTAMP: </span>
            <span className="text-slate-200 font-semibold">{activePoint.hour}</span>
          </div>
          <div>
            <span className="text-slate-500">24-HR PSI: </span>
            <span className="text-cyan-400 font-bold text-sm">{activePoint.val}</span>
          </div>
          <div>
            <span className="text-slate-500">1-HR PM2.5: </span>
            <span className="text-amber-400 font-bold text-sm">{activePoint.pm25} µg/m³</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> 0-50 Good
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-sky-500 inline-block" /> 51-100 Mod
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> 101-200 Unhealthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-purple-500 inline-block" /> &gt;300 Hazardous
          </span>
        </div>
      </div>

      {/* SVG Chart Stage */}
      <div className="relative w-full overflow-x-auto pt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Threshold Reference Bands */}
          {/* 50 Good line */}
          <line
            x1={padding.left}
            y1={getY(50)}
            x2={width - padding.right}
            y2={getY(50)}
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          {/* 100 Unhealthy line */}
          <line
            x1={padding.left}
            y1={getY(100)}
            x2={width - padding.right}
            y2={getY(100)}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          {/* 200 Very Unhealthy line */}
          {maxPsi >= 200 && (
            <line
              x1={padding.left}
              y1={getY(200)}
              x2={width - padding.right}
              y2={getY(200)}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
          )}
          {/* 300 Hazardous line */}
          {maxPsi >= 300 && (
            <line
              x1={padding.left}
              y1={getY(300)}
              x2={width - padding.right}
              y2={getY(300)}
              stroke="#a855f7"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
          )}

          {/* Y Axis Grid Labels */}
          {[0, 50, 100, 200, 300].filter((v) => v <= maxPsi).map((val) => (
            <text
              key={val}
              x={padding.left - 8}
              y={getY(val) + 4}
              textAnchor="end"
              fill="#64748b"
              fontSize="10"
              className="font-mono tabular-nums"
            >
              {val}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#area-grad)" />

          {/* Main trend line */}
          <path d={lineD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive hover crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + graphHeight}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />
            </g>
          )}

          {/* Data point trigger zones */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x - graphWidth / (trend.length * 2)}
              y={padding.top}
              width={graphWidth / trend.length}
              height={graphHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}

          {/* X Axis Time Labels */}
          {points.filter((_, idx) => idx % 4 === 0 || idx === points.length - 1).map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              className="font-mono"
            >
              {p.hour}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
