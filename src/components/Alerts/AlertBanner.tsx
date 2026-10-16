import React from 'react';
import { AlertTriangle, ShieldAlert, X, ChevronRight, Settings } from 'lucide-react';
import { RegionData, RegionId } from '../../types/psi';
import { getPsiBandColor } from '../../services/psiService';

interface AlertBannerProps {
  hazardousRegions: RegionData[];
  onSelectRegion: (id: RegionId) => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  hazardousRegions,
  onSelectRegion,
  onOpenSettings,
  onDismiss,
}) => {
  if (hazardousRegions.length === 0) return null;

  // Find most severe region
  const worstRegion = [...hazardousRegions].sort((a, b) => b.psi24Hr - a.psi24Hr)[0];
  const isSevere = worstRegion.psi24Hr >= 200;
  const isHazardous = worstRegion.psi24Hr >= 300;
  const color = getPsiBandColor(worstRegion.band);

  return (
    <div
      className={`relative w-full border-b transition-all duration-300 ${
        isHazardous
          ? 'bg-purple-950/90 border-purple-800 text-purple-100'
          : isSevere
          ? 'bg-rose-950/90 border-rose-800 text-rose-100'
          : 'bg-amber-950/80 border-amber-800 text-amber-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isHazardous ? 'bg-purple-900/80' : isSevere ? 'bg-rose-900/80' : 'bg-amber-900/80'
            }`}
          >
            {isHazardous ? <ShieldAlert className="w-5 h-5 text-purple-300 animate-pulse" /> : <AlertTriangle className="w-5 h-5 text-amber-300" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                {isHazardous ? 'HAZARDOUS AIR ADVISORY' : isSevere ? 'VERY UNHEALTHY AIR ADVISORY' : 'AIR QUALITY ALERT'}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 font-bold">
                {worstRegion.name}: PSI {worstRegion.psi24Hr} (1-hr PM2.5: {worstRegion.pm25_1Hr} µg/m³)
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isHazardous
                ? 'Minimise outdoor activity. Wear N95 respirator if stepping outside. Keep windows closed with air purifiers on.'
                : isSevere
                ? 'Avoid prolonged or strenuous outdoor physical exertion. Elderly, pregnant women & children should remain indoors.'
                : 'Vulnerable individuals should reduce prolonged outdoor activities.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectRegion(worstRegion.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 transition-colors"
          >
            <span>Inspect {worstRegion.name.replace(' Region', '')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-white/10 transition-colors"
            title="Configure Threshold Alerts"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-white/10 transition-colors"
            title="Dismiss Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
