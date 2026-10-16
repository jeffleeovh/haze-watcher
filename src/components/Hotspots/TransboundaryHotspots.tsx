import React from 'react';
import { HazeHotspotData } from '../../types/psi';
import { Compass, Flame, Satellite, Wind, AlertCircle } from 'lucide-react';

interface TransboundaryHotspotsProps {
  hotspots: HazeHotspotData;
}

export const TransboundaryHotspots: React.FC<TransboundaryHotspotsProps> = ({ hotspots }) => {
  const getRiskColor = (risk: HazeHotspotData['hazeRiskLevel']) => {
    switch (risk) {
      case 'Low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Moderate':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'High':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Severe':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>ASMC Regional Haze &amp; Hotspot Telemetry</span>
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">
            Sumatra &amp; Kalimantan Transboundary Fire Detection
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${getRiskColor(hotspots.hazeRiskLevel)}`}>
          Haze Plume Risk: {hotspots.hazeRiskLevel}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Sumatra Hotspots */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SUMATRA BASIN</span>
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {hotspots.sumatraHotspots}
            </div>
            <div className="text-[11px] text-slate-400">Active Thermal Fire Anomalies</div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono uppercase">
            Riau &amp; Jambi Provinces
          </div>
        </div>

        {/* Kalimantan Hotspots */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>KALIMANTAN BASIN</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {hotspots.kalimantanHotspots}
            </div>
            <div className="text-[11px] text-slate-400">Borneo Fire Hotspots</div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono uppercase">
            West &amp; Central Kalimantan
          </div>
        </div>

        {/* Wind Vector Compass */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>REGIONAL SURFACE WIND</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span
                className="inline-block transform transition-transform"
                style={{ transform: `rotate(${hotspots.windDirectionDegrees}deg)` }}
              >
                ↑
              </span>
              <span>{hotspots.windDirectionDegrees}°</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-medium">{hotspots.windDirectionText}</div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Velocity: <strong className="text-white">{hotspots.windSpeedKmh} km/h</strong>
          </div>
        </div>

        {/* ASMC Alert Level & Satellite */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ASMC ALERT STATUS</span>
            <Satellite className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="my-2">
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Level {hotspots.asmcAlertLevel} (Dry Season)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{hotspots.satelliteLastPass}</div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Himawari-9 &amp; NOAA-20 Imagery
          </div>
        </div>
      </div>
    </div>
  );
};
