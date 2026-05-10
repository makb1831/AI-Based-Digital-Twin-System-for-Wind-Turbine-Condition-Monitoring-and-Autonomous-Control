export interface TelemetryState {
  windSpeed: number;
  windDirection: number;
  airDensity: number;
  ambientTemperature: number;
  turbulence: number;
  rotorSpeed: number;
  powerGenerated: number;
  temperature: number;
  vibration: number;
  bladePitch: number;
  yaw: number;
  brakingSystem: boolean;
  aiAutoMode: boolean;
  status: 'optimal' | 'warning' | 'critical';
  timestamp: number;
}

export interface AlertEvent {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

export interface SystemReport {
  generatedAt: number;
  sampleCount: number;
  averagePower: number;
  peakPower: number;
  averageWindSpeed: number;
  maxTemperature: number;
  maxVibration: number;
  warningCount: number;
  criticalCount: number;
  operatingRate: number;
  dominantStatus: TelemetryState['status'];
  trend: {
    power: number;
    windSpeed: number;
    windDirection: number;
    temperature: number;
    vibration: number;
  };
  recommendations: string[];
  recentAlerts: AlertEvent[];
  environment: {
    ambientTemperature: number;
    airDensity: number;
    turbulence: number;
    windDirection: number;
  };
}

export interface AIDiagnosticReport {
  analysis: string;
  recommendation: string;
  healthScore: number;
  generatedAt: number;
  source: 'gemini' | 'cache' | 'fallback';
}
