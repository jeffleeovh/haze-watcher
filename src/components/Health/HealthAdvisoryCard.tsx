import React from 'react';
import { PsiBand } from '../../types/psi';
import { Heart, UserCheck, Shield, AlertOctagon, Wind, Info } from 'lucide-react';
import { getPsiBandColor } from '../../services/psiService';

interface HealthAdvisoryCardProps {
  currentBand: PsiBand;
  psiValue: number;
  pm25Value: number;
}

export const HealthAdvisoryCard: React.FC<HealthAdvisoryCardProps> = ({
  currentBand,
  psiValue,
  pm25Value,
}) => {
  const color = getPsiBandColor(currentBand);

  const getAdvisories = () => {
    switch (currentBand) {
      case 'good':
        return {
          healthy: 'Normal outdoor activities permitted without restrictions.',
          vulnerable: 'Normal activities permitted. Air quality is satisfactory.',
          mask: 'No respiratory protection required.',
          indoor: 'Windows may remain open for natural ventilation.',
        };
      case 'moderate':
        return {
          healthy: 'Normal outdoor physical activities permitted.',
          vulnerable: 'Normal outdoor activities. Monitor symptoms if experiencing respiratory discomfort.',
          mask: 'Not needed for general public.',
          indoor: 'Natural ventilation is fine.',
        };
      case 'unhealthy':
        return {
          healthy: 'Reduce prolonged or strenuous outdoor physical exertion.',
          vulnerable: 'Avoid prolonged or strenuous outdoor exertion. Keep rescue inhalers accessible.',
          mask: 'N95 masks recommended if required to be outdoors for prolonged periods.',
          indoor: 'Keep windows and doors closed. Run air conditioners and HEPA air purifiers.',
        };
      case 'very_unhealthy':
        return {
          healthy: 'Avoid prolonged or strenuous outdoor physical exertion. Move workouts indoors.',
          vulnerable: 'Stay indoors and avoid all outdoor activities. Seek medical attention if unwell.',
          mask: 'N95 masks strongly recommended when outdoors for any essential transit.',
          indoor: 'Seal gaps, close windows, operate HEPA air cleaners on high circulation.',
        };
      case 'hazardous':
        return {
          healthy: 'Minimise all outdoor activity. Cease all non-essential outdoor work and exercise.',
          vulnerable: 'Remain strictly indoors. Vulnerable persons must stay in air-conditioned clean rooms.',
          mask: 'N95 respirator required for any outdoor exposure. Ensure tight facial seal.',
          indoor: 'Operate certified portable HEPA filtration units continuously. Close all air dampers.',
        };
    }
  };

  const adv = getAdvisories();

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>NEA Air Quality Health Advisory Guidelines</span>
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">
            Prescribed Protective Measures for Current Air State
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase ${color.badge}`}>
          {currentBand.replace('_', ' ')} (PSI {psiValue})
        </div>
      </div>

      {/* Advisory Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* Healthy Population */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-slate-300">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Healthy Individuals</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{adv.healthy}</p>
        </div>

        {/* Vulnerable Population */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-rose-300">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Vulnerable Groups (Elderly, Pregnant, Children, Heart/Lung)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{adv.vulnerable}</p>
        </div>

        {/* N95 Mask Guideline */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-amber-300">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>N95 Respirator Guidance</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{adv.mask}</p>
          <div className="text-[11px] text-slate-500">
            * Note: Surgical and paper masks do not protect against fine PM2.5 haze particles.
          </div>
        </div>

        {/* Indoor Air & Purifier Protocol */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-sky-300">
            <Wind className="w-4 h-4 text-sky-400" />
            <span>Indoor Environment &amp; HEPA Filtration</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{adv.indoor}</p>
        </div>
      </div>
    </div>
  );
};
