/**
 * Singapore HazeWatch Web Push Notification & Audio Chime Service
 */

import { AirAlertRecord, PsiBand, RegionId } from '../types/psi';

const STORAGE_KEY_ALERTS = 'hazewatch_alerts_history';
const STORAGE_KEY_CONFIG = 'hazewatch_alert_config';

export class NotificationService {
  private static audioCtx: AudioContext | null = null;

  /**
   * Check if the browser supports notifications
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request browser notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return Notification.permission;
    }
  }

  /**
   * Plays a distinct synthesized warning chime using Web Audio API
   */
  static playWarningSound(isHazardous: boolean = false): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtxClass();
      }
      const ctx = this.audioCtx;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      gainNode.connect(ctx.destination);
      osc1.connect(gainNode);
      osc2.connect(gainNode);

      if (isHazardous) {
        // Urgent alternating tone (Hazardous alert)
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc1.frequency.setValueAtTime(880, now + 0.3);
        osc1.frequency.setValueAtTime(659.25, now + 0.45);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(329.63, now + 0.15);
        osc2.frequency.setValueAtTime(440, now + 0.3);
        osc2.frequency.setValueAtTime(329.63, now + 0.45);

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.7);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.7);
        osc2.stop(now + 0.7);
      } else {
        // High-low dual chime (Unhealthy alert)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.start(now);
        osc1.stop(now + 0.45);
      }
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e);
    }
  }

  /**
   * Dispatches a native browser push notification
   */
  static sendPush(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'sg-haze-alert',
        ...options,
      });
      return true;
    } catch (e) {
      console.warn('Notification trigger failed:', e);
      return false;
    }
  }

  /**
   * Triggers an alert event: sounds chime, dispatches push notification, and logs to history
   */
  static triggerAlert(
    region: RegionId,
    regionName: string,
    psi: number,
    pm25: number,
    level: PsiBand,
    soundEnabled: boolean = true
  ): AirAlertRecord {
    const isHazardous = level === 'hazardous' || level === 'very_unhealthy';
    
    let levelLabel = 'Elevated Air Pollution';
    if (level === 'unhealthy') levelLabel = 'Unhealthy (PSI > 100)';
    if (level === 'very_unhealthy') levelLabel = 'Very Unhealthy (PSI > 200)';
    if (level === 'hazardous') levelLabel = 'HAZARDOUS (PSI > 300)';

    const advisory = isHazardous
      ? 'Avoid outdoor physical exertion. Wear N95 mask if outdoors.'
      : 'Reduce prolonged or strenuous outdoor activities.';

    const title = `⚠️ ${levelLabel}: ${regionName}`;
    const body = `${regionName} PSI has reached ${psi} (PM2.5: ${pm25} µg/m³). ${advisory}`;

    if (soundEnabled) {
      this.playWarningSound(isHazardous);
    }

    this.sendPush(title, {
      body,
      silent: !soundEnabled,
    });

    const record: AirAlertRecord = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      region,
      regionName,
      psi,
      pm25,
      level,
      message: `${levelLabel}: PSI ${psi} · PM2.5 ${pm25} µg/m³. ${advisory}`,
      isRead: false,
    };

    this.saveAlertToHistory(record);
    return record;
  }

  /**
   * Save alert record to local storage
   */
  static saveAlertToHistory(alert: AirAlertRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getAlertHistory();
      const updated = [alert, ...existing.slice(0, 49)];
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Retrieve alert history
   */
  static getAlertHistory(): AirAlertRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (!raw) return [];
      return JSON.parse(raw) as AirAlertRecord[];
    } catch {
      return [];
    }
  }

  /**
   * Clear alert history
   */
  static clearAlertHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_ALERTS);
    } catch {
      // Ignore
    }
  }
}
