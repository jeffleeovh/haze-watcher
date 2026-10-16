import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AirAlertRecord,
  AlertThresholdConfig,
  HazeHotspotData,
  HourlyTrendPoint,
  RegionData,
  RegionId,
  SimulationMode,
  StationLocation,
} from './types/psi';
import { PsiService, getPsiBandColor } from './services/psiService';
import { NotificationService } from './services/notificationService';
import { SingaporeMap } from './components/Map/SingaporeMap';
import { AlertBanner } from './components/Alerts/AlertBanner';
import { AlertConfigModal } from './components/Alerts/AlertConfigModal';
import { PsiTrendChart } from './components/Charts/PsiTrendChart';
import { HealthAdvisoryCard } from './components/Health/HealthAdvisoryCard';
import { TransboundaryHotspots } from './components/Hotspots/TransboundaryHotspots';
import { RegionDetailDrawer } from './components/Metrics/RegionDetailDrawer';
import {
  ShieldAlert,
  Bell,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_ALERT_CONFIG: AlertThresholdConfig = {
  enabled: true,
  triggerLevel: 'unhealthy',
  psiThreshold: 101,
  pm25Threshold: 56,
  targetRegion: 'all',
  soundAlert: true,
  browserPushEnabled: false,
};

export default function App() {
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('live');
  const [regions, setRegions] = useState<Record<RegionId, RegionData> | null>(null);
  const [hotspots, setHotspots] = useState<HazeHotspotData | null>(null);
  const [trend, setTrend] = useState<HourlyTrendPoint[]>([]);
  const [stations, setStations] = useState<StationLocation[]>([]);
  const [timestamp, setTimestamp] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active selections
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('national');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState<boolean>(false);

  // Alert & Notification states
  const [alertConfig, setAlertConfig] = useState<AlertThresholdConfig>(DEFAULT_ALERT_CONFIG);
  const [alertHistory, setAlertHistory] = useState<AirAlertRecord[]>([]);
  const lastAlertTimeRef = useRef<number>(0);

  // Load initial settings and history
  useEffect(() => {
    setAlertHistory(NotificationService.getAlertHistory());
    const permission = NotificationService.getPermission();
    if (permission === 'granted') {
      setAlertConfig((prev) => ({ ...prev, browserPushEnabled: true }));
    }
  }, []);

  // Fetch PSI data
  const loadData = useCallback(async (mode: SimulationMode) => {
    setIsLoading(true);
    try {
      const data = await PsiService.fetchPsiData(mode);
      setRegions(data.regions);
      setHotspots(data.hotspots);
      setTrend(data.trend);
      setStations(data.stations);
      setTimestamp(data.timestamp);
      setDataSource(data.source);
      setAlertBannerDismissed(false);

      // Check thresholds and dispatch notification if breached
      checkThresholdBreaches(data.regions, alertConfig);
    } catch (err) {
      console.error('Failed to load air quality data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [alertConfig]);

  useEffect(() => {
    loadData(simulationMode);
  }, [simulationMode, loadData]);

  // Periodic refresh (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(simulationMode);
    }, 60000);
    return () => clearInterval(interval);
  }, [simulationMode, loadData]);

  // Check if any region breaches user-defined threshold
  const checkThresholdBreaches = (
    currentRegions: Record<RegionId, RegionData>,
    config: AlertThresholdConfig
  ) => {
    if (!config.enabled) return;

    // Throttle automated alerts to at most once per 30 seconds during active usage
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 30000) return;

    const targetList: RegionId[] =
      config.targetRegion === 'all'
        ? ['national', 'north', 'south', 'east', 'west', 'central']
        : [config.targetRegion];

    for (const key of targetList) {
      const reg = currentRegions[key];
      if (!reg) continue;

      const psiBreached = reg.psi24Hr >= config.psiThreshold;
      const pm25Breached = reg.pm25_1Hr >= config.pm25Threshold;

      if (psiBreached || pm25Breached) {
        lastAlertTimeRef.current = now;
        const newRecord = NotificationService.triggerAlert(
          reg.id,
          reg.name,
          reg.psi24Hr,
          reg.pm25_1Hr,
          reg.band,
          config.soundAlert
        );
        setAlertHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
        break; // Trigger for the first breaching region
      }
    }
  };

  // Immediate Test Alert dispatcher
  const handleSendTestAlert = () => {
    const testRegion = regions?.west || {
      id: 'west' as RegionId,
      name: 'West Region',
      psi24Hr: 335,
      pm25_1Hr: 280,
      band: 'hazardous' as const,
    };

    const newRecord = NotificationService.triggerAlert(
      testRegion.id,
      testRegion.name,
      testRegion.psi24Hr,
      testRegion.pm25_1Hr,
      testRegion.band,
      alertConfig.soundAlert
    );
    setAlertHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
  };

  const handleClearAlertHistory = () => {
    NotificationService.clearAlertHistory();
    setAlertHistory([]);
  };

  // Hazardous regions calculation
  const hazardousRegionsList = regions
    ? Object.values(regions).filter(
        (r) =>
          r.psi24Hr >= alertConfig.psiThreshold ||
          r.band === 'hazardous' ||
          r.band === 'very_unhealthy' ||
          (alertConfig.triggerLevel === 'unhealthy' && r.band === 'unhealthy')
      )
    : [];

  const nationalData = regions?.national;
  const activeFocusData = regions ? regions[selectedRegion] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones separated by gap-8) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
          >
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>HazeWatch SG</span>
          </a>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-400">
            <a href="#radar-map" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Radar Map
            </a>
            <a href="#regional-grid" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              5 Sectors
            </a>
            <a href="#trajectory-chart" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              24-Hr Trends
            </a>
            <a href="#transboundary-hotspots" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              ASMC Hotspots
            </a>
            <a href="#health-advisory" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              NEA Advisory
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setConfigModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Configure Alerts</span>
              {alertConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-slate-950/70 inline-block" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hazardous / Unhealthy Active Alert Banner */}
      {!alertBannerDismissed && hazardousRegionsList.length > 0 && (
        <AlertBanner
          hazardousRegions={hazardousRegionsList}
          onSelectRegion={(id) => {
            setSelectedRegion(id);
            setDrawerOpen(true);
          }}
          onOpenSettings={() => setConfigModalOpen(true)}
          onDismiss={() => setAlertBannerDismissed(true)}
        />
      )}

      {/* Sub-Header Workspace Telemetry Bar */}
      <section className="border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <strong className="text-white">STREAM:</strong> {dataSource}
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>UPDATED: {timestamp || 'Syncing...'}</span>
            </span>
          </div>

          {/* Simulation & Scenario Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Test Scenario:</span>
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSimulationMode('live')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  simulationMode === 'live'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Live official NEA Singapore data feed"
              >
                Live NEA Feed
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('unhealthy_spike')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  simulationMode === 'unhealthy_spike'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Test Unhealthy smoke spike (PSI ~185)"
              >
                Unhealthy Spike
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('hazardous_haze')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  simulationMode === 'hazardous_haze'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Test Hazardous transboundary haze event (PSI ~338)"
              >
                Hazardous Event
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('pristine_day')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  simulationMode === 'pristine_day'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Test Pristine clean tropical air (PSI ~32)"
              >
                Clear Day
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadData(simulationMode)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Force Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Main App Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1">
        {/* National Overview KPI Strip */}
        {nationalData && (
          <section className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Primary Singapore PSI Hero Metric */}
              <div
                className={`p-5 rounded-2xl border ${getPsiBandColor(nationalData.band).border} ${
                  getPsiBandColor(nationalData.band).bg
                } flex flex-col justify-between md:col-span-2 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Singapore National 24-Hr PSI
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase font-bold border ${
                      getPsiBandColor(nationalData.band).badge
                    }`}
                  >
                    {nationalData.band.replace('_', ' ')}
                  </span>
                </div>

                <div className="my-3 flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                    {nationalData.psi24Hr}
                  </span>
                  <span className="text-xs font-mono text-slate-400">INDEX POINTS</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-2 border-t border-white/10">
                  <span>1-Hr PM2.5: <strong className="text-amber-400">{nationalData.pm25_1Hr} µg/m³</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegion('national');
                      setDrawerOpen(true);
                    }}
                    className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-semibold"
                  >
                    <span>Full Sub-Index</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 1-Hr PM2.5 Primary Outdoor Metric */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    1-Hour PM2.5 (Key Outdoor Metric)
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">NEA Standard</span>
                </div>

                <div className="my-3">
                  <div className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                    {nationalData.pm25_1Hr} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium capitalize mt-1">
                    Band: {nationalData.pm25Band}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Used by NEA for immediate decisions on outdoor sporting activities.
                </div>
              </div>

              {/* Alert Guard Status Card */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Push Alert Protection
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfigModalOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        alertConfig.enabled ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-base font-semibold text-white">
                      {alertConfig.enabled ? 'Threshold Guard Active' : 'Alerts Disabled'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Trigger: <strong className="text-cyan-400">PSI &gt; {alertConfig.psiThreshold}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  className="w-full py-1.5 px-3 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-center"
                >
                  Send Test Alert
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Section 1: Interactive Singapore Map Stage */}
        <section id="radar-map" className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Interactive Air Quality &amp; PSI Radar Map
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any sector or monitoring station pin to inspect localized air readings, wind flow, and haze plume contours.
              </p>
            </div>
          </div>

          {regions && hotspots && (
            <SingaporeMap
              regions={regions}
              stations={stations}
              hotspots={hotspots}
              selectedRegion={selectedRegion}
              onSelectRegion={(reg) => {
                setSelectedRegion(reg);
                if (reg !== 'national') {
                  setDrawerOpen(true);
                }
              }}
              onSelectStation={() => {
                setDrawerOpen(true);
              }}
            />
          )}
        </section>

        {/* Section 2: 5 Regional Sectors Detailed Grid */}
        <section id="regional-grid" className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Official Singapore Regional Sectors
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time breakdown across North, South, East, West, and Central planning sectors.
              </p>
            </div>
          </div>

          {regions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {(['north', 'south', 'east', 'west', 'central'] as RegionId[]).map((rId) => {
                const reg = regions[rId];
                const color = getPsiBandColor(reg.band);
                const isSelected = selectedRegion === rId;

                return (
                  <div
                    key={rId}
                    onClick={() => {
                      setSelectedRegion(rId);
                      setDrawerOpen(true);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-900/90 ring-1 ring-cyan-400 shadow-xl'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
                        {rId}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${color.badge}`}>
                        {reg.band.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="my-3">
                      <div className="text-3xl font-extrabold font-mono text-white tabular-nums">
                        {reg.psi24Hr}
                        <span className="text-xs font-normal text-slate-500 ml-1">PSI</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        1-hr PM2.5: <span className="text-amber-400 font-bold">{reg.pm25_1Hr} µg/m³</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[120px]">{reg.areas[0]}</span>
                      <span className="text-cyan-400 font-medium">Inspect →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: 24-Hour Diurnal Trend Analysis */}
        <section id="trajectory-chart" className="w-full">
          <PsiTrendChart
            trend={trend}
            selectedRegion={selectedRegion}
            onSelectRegion={(r) => setSelectedRegion(r)}
          />
        </section>

        {/* Section 4: ASMC Transboundary Haze Hotspots */}
        <section id="transboundary-hotspots" className="w-full">
          {hotspots && <TransboundaryHotspots hotspots={hotspots} />}
        </section>

        {/* Section 5: NEA Air Quality Health Advisory */}
        <section id="health-advisory" className="w-full">
          {nationalData && (
            <HealthAdvisoryCard
              currentBand={activeFocusData?.band || nationalData.band}
              psiValue={activeFocusData?.psi24Hr || nationalData.psi24Hr}
              pm25Value={activeFocusData?.pm25_1Hr || nationalData.pm25_1Hr}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 mt-12 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>Singapore Air Quality &amp; PSI Live Radar</span>
            <span className="mx-2">·</span>
            <span>Data format compliant with NEA &amp; ASMC</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Serverless-Ready Client</span>
            <span>·</span>
            <span>Web Push Notification Engine</span>
          </div>
        </div>
      </footer>

      {/* Slide-out Region Detail Drawer */}
      <RegionDetailDrawer
        region={activeFocusData}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectAnotherRegion={(rId) => setSelectedRegion(rId)}
      />

      {/* Threshold & Notification Configuration Modal */}
      <AlertConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={alertConfig}
        onUpdateConfig={(newCfg) => setAlertConfig(newCfg)}
        alertHistory={alertHistory}
        onClearHistory={handleClearAlertHistory}
        onSendTestAlert={handleSendTestAlert}
      />
    </div>
  );
}
