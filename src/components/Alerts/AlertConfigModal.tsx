import React, { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX, ShieldAlert, CheckCircle2, X, Send, Trash2, Smartphone } from 'lucide-react';
import { AlertThresholdConfig, AirAlertRecord, RegionId } from '../../types/psi';
import { NotificationService } from '../../services/notificationService';

interface AlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertThresholdConfig;
  onUpdateConfig: (newConfig: AlertThresholdConfig) => void;
  alertHistory: AirAlertRecord[];
  onClearHistory: () => void;
  onSendTestAlert: () => void;
}

export const AlertConfigModal: React.FC<AlertConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  alertHistory,
  onClearHistory,
  onSendTestAlert,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    NotificationService.getPermission()
  );
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionState(res);
    if (res === 'granted') {
      onUpdateConfig({ ...config, browserPushEnabled: true, enabled: true });
    }
  };

  const handleTriggerTest = () => {
    onSendTestAlert();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Hazardous Threshold & Push Alert Settings</h2>
              <p className="text-xs text-slate-400">Configure Web Push & acoustic notifications for dangerous air quality</p>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Permission State Banner */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  permissionState === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : permissionState === 'denied'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase font-mono text-slate-300">
                  Browser Push Permission
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Status:{' '}
                  <span className={`font-mono font-semibold ${
                    permissionState === 'granted' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {permissionState.toUpperCase()}
                  </span>
                  {permissionState === 'granted'
                    ? ' · Ready to receive system notifications'
                    : ' · Click to allow browser push alerts'}
                </div>
              </div>
            </div>

            {permissionState !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Enable Push Alerts
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active</span>
              </div>
            )}
          </div>

          {/* Master Notification Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <div>
              <div className="text-sm font-semibold text-white">Continuous Air Guard Monitoring</div>
              <div className="text-xs text-slate-400">Trigger alerts when any region breaches selected thresholds</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateConfig({ ...config, enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Threshold Selection Presets */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Alert Trigger Threshold (NEA Standards)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    triggerLevel: 'unhealthy',
                    psiThreshold: 101,
                    pm25Threshold: 56,
                  })
                }
                className={`p-3 text-left rounded-xl border transition-all ${
                  config.triggerLevel === 'unhealthy'
                    ? 'border-amber-500/60 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-amber-400">UNHEALTHY</div>
                <div className="text-base font-bold font-mono text-white mt-1">PSI &gt; 100</div>
                <div className="text-[11px] text-slate-400 mt-1">PM2.5 &gt; 55 µg/m³</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    triggerLevel: 'very_unhealthy',
                    psiThreshold: 201,
                    pm25Threshold: 151,
                  })
                }
                className={`p-3 text-left rounded-xl border transition-all ${
                  config.triggerLevel === 'very_unhealthy'
                    ? 'border-rose-500/60 bg-rose-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-rose-400">VERY UNHEALTHY</div>
                <div className="text-base font-bold font-mono text-white mt-1">PSI &gt; 200</div>
                <div className="text-[11px] text-slate-400 mt-1">PM2.5 &gt; 150 µg/m³</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    ...config,
                    triggerLevel: 'hazardous',
                    psiThreshold: 301,
                    pm25Threshold: 251,
                  })
                }
                className={`p-3 text-left rounded-xl border transition-all ${
                  config.triggerLevel === 'hazardous'
                    ? 'border-purple-500/60 bg-purple-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-purple-400">HAZARDOUS</div>
                <div className="text-base font-bold font-mono text-white mt-1">PSI &gt; 300</div>
                <div className="text-[11px] text-slate-400 mt-1">PM2.5 &gt; 250 µg/m³</div>
              </button>
            </div>
          </div>

          {/* Custom PSI Slider */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Fine-tune PSI Trigger Value</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">PSI {config.psiThreshold}</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="5"
              value={config.psiThreshold}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  psiThreshold: parseInt(e.target.value, 10),
                  triggerLevel: 'custom',
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50 (Moderate)</span>
              <span>100 (Unhealthy)</span>
              <span>200 (Very Unhealthy)</span>
              <span>300 (Hazardous)</span>
              <span>400+</span>
            </div>
          </div>

          {/* Target Region Scope */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Region Filter
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-mono">
              {[
                { id: 'all', label: 'All SG' },
                { id: 'north', label: 'North' },
                { id: 'south', label: 'South' },
                { id: 'east', label: 'East' },
                { id: 'west', label: 'West' },
                { id: 'central', label: 'Central' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, targetRegion: item.id as any })}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-colors ${
                    config.targetRegion === item.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Chime Settings */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => NotificationService.playWarningSound(config.psiThreshold >= 200)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                title="Preview Chime Sound"
              >
                {config.soundAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <div>
                <div className="text-xs font-semibold text-white">Acoustic Emergency Chime</div>
                <div className="text-[11px] text-slate-400">Plays dual-frequency synth warning tone on breach</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateConfig({ ...config, soundAlert: !config.soundAlert })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.soundAlert ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  config.soundAlert ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Test Alert Dispatcher Button */}
          <div className="p-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-cyan-200">Verify Push Alert Delivery</div>
              <div className="text-[11px] text-slate-400">Dispatches an instant simulation notification to test sound and browser push</div>
            </div>
            <button
              type="button"
              onClick={handleTriggerTest}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSent ? 'Alert Dispatched!' : 'Send Test Push Alert'}</span>
            </button>
          </div>

          {/* Alert History Audit Log */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Triggered Alert History ({alertHistory.length})
              </span>
              {alertHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {alertHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl bg-slate-950/20">
                No alerts triggered yet. Monitoring active for threshold breaches.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {alertHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>{rec.regionName}</span>
                        <span className="font-mono text-cyan-400 text-[11px]">PSI {rec.psi}</span>
                        <span className="text-slate-500 text-[10px] font-mono">· PM2.5: {rec.pm25} µg/m³</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{rec.message}</div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{rec.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
