/**
 * Singapore PSI & Air Quality Monitoring Types
 * Aligned with NEA (National Environment Agency) and ASMC standards
 */

export type RegionId = 'national' | 'north' | 'south' | 'east' | 'west' | 'central';

export type PsiBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export type Pm25Band = 'normal' | 'elevated' | 'high' | 'very_high';

export interface PollutantReadings {
  psi24Hr: number;
  pm25_1Hr: number;
  pm25_24Hr: number;
  pm10_24Hr: number;
  so2_24Hr: number;
  no2_1Hr: number;
  o3_8Hr: number;
  co_8Hr: number;
}

export interface RegionData extends PollutantReadings {
  id: RegionId;
  name: string;
  areas: string[];
  band: PsiBand;
  pm25Band: Pm25Band;
  coordinates: { lat: number; lng: number };
  trendDirection: 'rising' | 'falling' | 'stable';
  delta24Hr: number;
}

export interface StationLocation {
  id: string;
  name: string;
  region: RegionId;
  lat: number;
  lng: number;
  pm25: number;
  psi: number;
  status: 'online' | 'calibrating';
}

export interface HourlyTrendPoint {
  hour: string; // e.g. "14:00"
  national: number;
  north: number;
  south: number;
  east: number;
  west: number;
  central: number;
  pm25: number;
}

export interface HazeHotspotData {
  sumatraHotspots: number;
  kalimantanHotspots: number;
  windDirectionDegrees: number;
  windDirectionText: string;
  windSpeedKmh: number;
  asmcAlertLevel: 1 | 2 | 3;
  hazeRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  satelliteLastPass: string;
}

export interface AlertThresholdConfig {
  enabled: boolean;
  triggerLevel: 'unhealthy' | 'very_unhealthy' | 'hazardous' | 'custom';
  psiThreshold: number; // e.g. 101, 201, 300, or custom
  pm25Threshold: number; // e.g. 56
  targetRegion: 'all' | RegionId;
  soundAlert: boolean;
  browserPushEnabled: boolean;
}

export interface AirAlertRecord {
  id: string;
  timestamp: string;
  region: RegionId;
  regionName: string;
  psi: number;
  pm25: number;
  level: PsiBand;
  message: string;
  isRead: boolean;
}

export type SimulationMode = 'live' | 'hazardous_haze' | 'unhealthy_spike' | 'pristine_day';
