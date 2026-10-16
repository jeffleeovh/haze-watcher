import React from 'react';
import { RegionData, RegionId } from '../../types/psi';
import { getPsiBandColor } from '../../services/psiService';
import { MapPin, X, ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Wind, Droplets } from 'lucide-react';

interface RegionDetailDrawerProps {
  region: RegionData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAnotherRegion: (id: RegionId) => void;
}

export const RegionDetailDrawer: React.FC<RegionDetailDrawerProps> = ({
  region,
  isOpen,
  onClose,
  onSelectAnotherRegion,
}) => {
  if (!isOpen || !region) return null;

  const color = getPsiBandColor(region.band);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{region.name}</h2>
            <div className="text-xs text-slate-400 font-mono">
              {region.coordinates.lat.toFixed(4)}°N, {region.coordinates.lng.toFixed(4)}°E
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto space-y-5 flex-1">
        {/* Big PSI Hero Banner */}
        <div className={`p-5 rounded-2xl border ${color.border} ${color.bg} flex items-center justify-between`}>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              24-Hour Pollutant Index (PSI)
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold font-mono text-white tabular-nums">
                {region.psi24Hr}
              </span>
              <span className={`text-sm font-semibold uppercase font-mono ${color.text}`}>
                {region.band.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono">
              {region.delta24Hr > 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">+{region.delta24Hr} PSI</span> vs yesterday
                </>
              ) : region.delta24Hr < 0 ? (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{region.delta24Hr} PSI</span> vs yesterday
                </>
              ) : (
                <>
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Stable</span>
                </>
              )}
            </div>
          </div>

          {/* 1-hr PM2.5 Callout */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">1-hr PM2.5</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {region.pm25_1Hr} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
            </div>
            <div className="text-[10px] text-slate-400 capitalize mt-0.5">{region.pm25Band}</div>
          </div>
        </div>

        {/* Planning Areas Included */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Observation Areas Covered
          </div>
          <div className="flex flex-wrap gap-1.5">
            {region.areas.map((area) => (
              <span
                key={area}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Full 6-Pollutant Sub-Index Table */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            NEA 6-Pollutant Sub-Index Breakdown
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">1-hr PM2.5</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.pm25_1Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Fine inhalable particulates</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">24-hr PM2.5</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.pm25_24Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">24-hour mean concentration</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">24-hr PM10</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.pm10_24Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Coarse dust &amp; ash particles</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">8-hr Ozone (O3)</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.o3_8Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Photochemical smog sub-index</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">1-hr Nitrogen Dioxide (NO2)</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.no2_1Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Vehicle &amp; industrial combustion</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="text-[11px] font-mono text-slate-400">24-hr Sulphur Dioxide (SO2)</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.so2_24Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Petrochemical emission indicator</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 col-span-2">
              <div className="text-[11px] font-mono text-slate-400">8-hr Carbon Monoxide (CO)</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {region.co_8Hr} <span className="text-xs text-slate-400 font-normal">mg/m³</span>
              </div>
              <div className="text-[10px] text-slate-500">Biomass incomplete combustion signature</div>
            </div>
          </div>
        </div>

        {/* Switch region selector */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Compare Another Sector
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
            {(['north', 'south', 'east', 'west', 'central', 'national'] as RegionId[]).map((rId) => (
              <button
                key={rId}
                type="button"
                onClick={() => onSelectAnotherRegion(rId)}
                className={`py-2 rounded-lg border text-center capitalize transition-colors ${
                  region.id === rId
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                {rId === 'national' ? 'SG Total' : rId}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
