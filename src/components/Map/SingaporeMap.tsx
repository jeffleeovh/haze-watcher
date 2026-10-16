import React, { useState } from 'react';
import { getPsiBandColor } from '../../services/psiService';
import { HazeHotspotData, RegionData, RegionId, StationLocation } from '../../types/psi';
import { Layers, Wind, Radio, Eye, Crosshair, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SingaporeMapProps {
  regions: Record<RegionId, RegionData>;
  stations: StationLocation[];
  hotspots: HazeHotspotData;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  onSelectStation?: (station: StationLocation) => void;
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  regions,
  stations,
  hotspots,
  selectedRegion,
  onSelectRegion,
  onSelectStation,
}) => {
  const [showWind, setShowWind] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);
  const [hoveredStation, setHoveredStation] = useState<StationLocation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // SVG Paths mapped accurately to Singapore regional boundaries in a 960x520 coordinate frame
  // Centered roughly on 103.82°E, 1.35°N
  const regionPaths: Record<Exclude<RegionId, 'national'>, { d: string; labelX: number; labelY: number; centroid: [number, number] }> = {
    west: {
      // West: Tuas, Jurong, Boon Lay, Tengah, Choa Chu Kang, Jurong Island
      d: `
        M 18,340 
        C 40,320 70,300 110,290 
        C 150,280 180,260 210,230 
        C 240,210 270,180 300,165 
        C 330,155 350,155 375,175 
        C 385,210 370,250 355,280 
        C 340,310 320,335 300,355 
        C 280,375 250,390 220,400 
        C 180,410 140,415 110,400 
        C 85,388 50,380 20,385 
        Z 
        M 170,425 C 195,420 225,430 235,450 C 230,470 200,475 175,465 C 160,455 155,435 170,425 Z
      `,
      labelX: 230,
      labelY: 285,
      centroid: [230, 285],
    },
    north: {
      // North: Woodlands, Sembawang, Yishun, Mandai, Simpang
      d: `
        M 300,165 
        C 320,130 350,105 385,95 
        C 430,85 470,80 515,90 
        C 560,100 585,120 600,145 
        C 590,175 565,195 530,205 
        C 490,215 450,215 420,205 
        C 390,195 370,180 345,175 
        Z
      `,
      labelX: 450,
      labelY: 145,
      centroid: [450, 145],
    },
    central: {
      // Central: Bukit Timah, Bishan, Toa Payoh, Ang Mo Kio, Novena
      d: `
        M 375,175 
        C 410,185 450,210 490,210 
        C 525,210 550,225 565,250 
        C 555,280 535,305 510,320 
        C 475,340 440,345 405,335 
        C 375,325 360,305 355,280 
        C 365,245 370,210 375,175 
        Z
      `,
      labelX: 455,
      labelY: 265,
      centroid: [455, 265],
    },
    east: {
      // East: Tampines, Pasir Ris, Changi, Bedok, Pulau Ubin, Pulau Tekong
      d: `
        M 600,145 
        C 630,135 675,140 720,160 
        C 770,180 820,210 860,230 
        C 890,245 905,265 895,290 
        C 880,315 840,330 800,335 
        C 750,340 700,340 650,330 
        C 605,320 575,300 565,250 
        C 555,215 570,180 600,145 
        Z 
        M 680,95 C 720,85 750,95 760,115 C 740,125 700,120 680,105 Z 
        M 790,110 C 830,105 855,120 860,140 C 835,150 805,140 790,125 Z
      `,
      labelX: 730,
      labelY: 245,
      centroid: [730, 245],
    },
    south: {
      // South: Marina Bay, Sentosa, Tanjong Pagar, Telok Blangah
      d: `
        M 405,335 
        C 440,345 475,340 510,320 
        C 540,340 575,345 615,350 
        C 630,370 610,390 580,400 
        C 540,410 490,415 440,405 
        C 390,395 355,380 330,360 
        C 350,345 375,338 405,335 
        Z 
        M 430,425 C 470,418 495,430 485,448 C 455,455 425,445 430,425 Z
      `,
      labelX: 505,
      labelY: 370,
      centroid: [505, 370],
    },
  };

  const activeRegionData = regions[selectedRegion] || regions.national;
  const activeColor = getPsiBandColor(activeRegionData.band);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Map HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider font-semibold">Live Singapore Radar Map</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">5 NEA Observation Sectors</span>
          </div>
        </div>

        {/* Map Layer Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showHeatmap
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PSI Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWind(!showWind)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showWind
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showStations
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Stations</span>
          </button>

          {/* Zoom Actions */}
          <div className="flex items-center border border-slate-800 rounded-md overflow-hidden bg-slate-800/80 ml-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                onSelectRegion('national');
              }}
              className="p-1.5 text-slate-400 hover:text-white transition-colors border-l border-slate-700"
              title="Reset View"
              aria-label="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Map Stage */}
      <div className="relative w-full h-[360px] md:h-[460px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden cursor-crosshair">
        {/* Geographic Background Coordinate Grid & Straits */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Straits & Surrounding Labels */}
        <div className="absolute top-3 left-6 text-[11px] font-mono tracking-wider text-slate-600 uppercase select-none pointer-events-none">
          Straits of Johor / Malaysia
        </div>
        <div className="absolute bottom-3 right-8 text-[11px] font-mono tracking-wider text-slate-600 uppercase select-none pointer-events-none">
          Singapore Strait / Riau Islands (ID)
        </div>

        <svg
          viewBox="0 0 960 520"
          className="w-full h-full object-contain transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Gradients for regional fills */}
            <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>

            {/* Transboundary Smoke Haze Dispersion Filter */}
            <filter id="haze-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#334155" fillOpacity="0.6" />
            </pattern>
          </defs>

          {/* Regional Outer Contour Fill & Borders */}
          <g id="regions-layer">
            {(Object.keys(regionPaths) as Array<Exclude<RegionId, 'national'>>).map((regId) => {
              const info = regionPaths[regId];
              const regData = regions[regId];
              const color = getPsiBandColor(regData?.band || 'good');
              const isSelected = selectedRegion === regId;
              const isHovered = hoveredRegion === regId;

              // Fill color based on PSI
              let fillColor = color.hex;
              let fillOpacity = isSelected ? 0.42 : isHovered ? 0.32 : showHeatmap ? 0.22 : 0.12;

              return (
                <g key={regId} className="transition-all duration-200">
                  <path
                    d={info.d}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={isSelected ? '#38bdf8' : isHovered ? '#f8fafc' : color.hex}
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-200 hover:brightness-125"
                    onClick={() => onSelectRegion(regId)}
                    onMouseEnter={() => setHoveredRegion(regId)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  />

                  {/* Regional Centroid Badge with PSI number */}
                  <g
                    transform={`translate(${info.labelX}, ${info.labelY})`}
                    className="cursor-pointer pointer-events-none select-none"
                  >
                    {/* Pulsing ring if hazardous or selected */}
                    {(regData?.band === 'hazardous' || regData?.band === 'very_unhealthy' || isSelected) && (
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? 26 : 22}
                        fill="none"
                        stroke={color.hex}
                        strokeWidth="2"
                        strokeOpacity="0.6"
                        className="animate-ping"
                      />
                    )}

                    {/* Badge base pill */}
                    <rect
                      x="-44"
                      y="-22"
                      width="88"
                      height="44"
                      rx="8"
                      fill="#0b0f19"
                      stroke={isSelected ? '#38bdf8' : color.hex}
                      strokeWidth={isSelected ? 2 : 1}
                      fillOpacity="0.92"
                    />

                    {/* Region name & PSI */}
                    <text
                      x="0"
                      y="-6"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="600"
                      letterSpacing="0.05em"
                      className="uppercase font-mono"
                    >
                      {regData.name.replace(' Region', '')}
                    </text>
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill={color.hex}
                      fontSize="17"
                      fontWeight="700"
                      className="font-mono"
                    >
                      {regData.psi24Hr}
                      <tspan fontSize="9" fill="#64748b" dx="3">
                        PSI
                      </tspan>
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Animated Wind & Haze Dispersion Flow Lines */}
          {showWind && (
            <g id="wind-streamlines" className="pointer-events-none opacity-60">
              {/* Wind trajectories simulated along prevailing monsoon azimuth (e.g. 215° SSW) */}
              <path
                d="M 50,490 Q 200,380 340,240 T 480,100"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                className="animate-wind"
              />
              <path
                d="M 120,510 Q 280,390 440,270 T 600,120"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                className="animate-wind"
                style={{ animationDelay: '0.6s' }}
              />
              <path
                d="M 240,510 Q 400,380 560,260 T 720,110"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                className="animate-wind"
                style={{ animationDelay: '1.2s' }}
              />
              <path
                d="M 380,510 Q 520,390 680,270 T 840,130"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.6"
                className="animate-wind"
                style={{ animationDelay: '1.8s' }}
              />
            </g>
          )}

          {/* Individual Sensor Stations */}
          {showStations && (
            <g id="stations-layer">
              {stations.map((st) => {
                // Approximate coordinate projection from (lat, lng) to SVG (960x520)
                // Singapore bounds: Lat: ~1.22 to ~1.46, Lng: ~103.60 to ~104.03
                const x = ((st.lng - 103.6) / (104.03 - 103.6)) * 880 + 35;
                const y = ((1.47 - st.lat) / (1.47 - 1.22)) * 430 + 35;
                const stColor = getPsiBandColor(regions[st.region]?.band || 'good');

                return (
                  <g
                    key={st.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer"
                    onClick={() => {
                      onSelectRegion(st.region);
                      onSelectStation?.(st);
                    }}
                    onMouseEnter={() => setHoveredStation(st)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    <circle cx="0" cy="0" r="4.5" fill={stColor.hex} stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Hovered Station Tooltip */}
        {hoveredStation && (
          <div className="absolute top-16 right-4 bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-xl backdrop-blur pointer-events-none z-30">
            <div className="text-xs font-semibold text-slate-200">{hoveredStation.name}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              PSI: <span className="text-cyan-400 font-bold">{hoveredStation.psi}</span> · 1-hr PM2.5:{' '}
              <span className="text-amber-400 font-bold">{hoveredStation.pm25} µg/m³</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
              {hoveredStation.region} sector · Click to inspect
            </div>
          </div>
        )}

        {/* Bottom Corner Wind & Hotspot Legend Overlay */}
        <div className="absolute bottom-3 left-4 flex flex-col gap-1 bg-slate-950/85 border border-slate-800/90 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 backdrop-blur pointer-events-none">
          <div className="flex items-center gap-2">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Wind: <strong className="text-white">{hotspots.windDirectionText}</strong> @ {hotspots.windSpeedKmh} km/h
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            ASMC Sumatra Hotspots: <strong className="text-rose-400">{hotspots.sumatraHotspots}</strong> · Kalimantan:{' '}
            <strong className="text-rose-400">{hotspots.kalimantanHotspots}</strong>
          </div>
        </div>

        {/* Selected Region HUD Indicator */}
        <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono backdrop-blur flex items-center gap-2">
          <span className="text-slate-400">Active Focus:</span>
          <span className="font-semibold text-white">{activeRegionData.name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${activeColor.badge}`}>
            {activeRegionData.band.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Region Selector Pills Strip below Map */}
      <div className="flex items-center gap-1.5 p-2 bg-slate-950 border-t border-slate-800 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => onSelectRegion('national')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
            selectedRegion === 'national'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Islandwide (SG)
        </button>
        {(['north', 'south', 'east', 'west', 'central'] as RegionId[]).map((rId) => {
          const r = regions[rId];
          const c = getPsiBandColor(r?.band || 'good');
          const isSel = selectedRegion === rId;
          return (
            <button
              key={rId}
              type="button"
              onClick={() => onSelectRegion(rId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                isSel
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span className="capitalize">{rId}</span>
              <span className={`font-mono text-[11px] font-bold ${isSel ? 'text-slate-900' : c.text}`}>
                {r?.psi24Hr ?? '--'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
