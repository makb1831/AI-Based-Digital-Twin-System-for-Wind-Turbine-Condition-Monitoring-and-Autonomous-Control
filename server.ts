import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { AlertEvent, AIDiagnosticReport, SystemReport, TelemetryState } from './src/types';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), '.runtime');
const HISTORY_FILE = path.join(DATA_DIR, 'telemetry-history.json');
const HISTORY_LIMIT = 720;
const AI_REFRESH_MS = 45000;
const ROTOR_AREA_M2 = 11309;
const RATED_POWER_MW = 3.5;

app.use(express.json());

let state: TelemetryState = {
  windSpeed: 8.5,
  windDirection: 15,
  airDensity: 1.225,
  ambientTemperature: 24,
  turbulence: 0.12,
  rotorSpeed: 15.0,
  powerGenerated: 1.2,
  temperature: 65,
  vibration: 2.1,
  bladePitch: 0,
  yaw: 0,
  brakingSystem: false,
  aiAutoMode: true,
  status: 'optimal',
  timestamp: Date.now(),
};

let telemetryHistory: TelemetryState[] = [];
let alertFeed: AlertEvent[] = [];
let cachedAiReport: AIDiagnosticReport | null = null;
let lastAiRefresh = 0;
let aiRefreshPromise: Promise<void> | null = null;
let lastPersistAt = 0;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle: number) {
  const wrapped = angle % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function shortestAngleDifference(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

function approach(current: number, target: number, step: number) {
  if (Math.abs(current - target) <= step) {
    return target;
  }

  return current + Math.sign(target - current) * step;
}

function createAlert(type: AlertEvent['type'], message: string) {
  alertFeed.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    timestamp: Date.now(),
  });

  alertFeed = alertFeed.slice(0, 20);
}

function buildFallbackAiReport(snapshot: TelemetryState, reason: string): AIDiagnosticReport {
  const healthScore = clamp(
    100
      - (snapshot.temperature > 80 ? (snapshot.temperature - 80) * 1.15 : 0)
      - (snapshot.vibration > 3 ? (snapshot.vibration - 3) * 9 : 0)
      - (snapshot.brakingSystem ? 8 : 0)
      - (snapshot.status === 'warning' ? 10 : 0)
      - (snapshot.status === 'critical' ? 28 : 0),
    0,
    100,
  );

  return {
    analysis: `Local diagnostic fallback active. ${reason} Current telemetry is ${snapshot.status}, with ${snapshot.windSpeed.toFixed(1)} m/s wind, ${snapshot.turbulence.toFixed(2)} turbulence, and ${snapshot.temperature.toFixed(1)} °C operating temperature.`,
    recommendation: snapshot.status === 'critical'
      ? 'Engage braking, reduce pitch, and inspect thermal and vibration limits.'
      : snapshot.status === 'warning'
        ? 'Hold a cautious operating regime and monitor temperature, vibration, and yaw alignment.'
        : 'Maintain the present settings and continue watching the live trend.',
    healthScore,
    generatedAt: Date.now(),
    source: 'fallback',
  };
}

function buildSystemReport(samples: TelemetryState[]): SystemReport {
  const source = samples.length > 0 ? samples : [state];
  const sampleCount = source.length;
  const sum = source.reduce(
    (acc, point) => ({
      power: acc.power + point.powerGenerated,
      wind: acc.wind + point.windSpeed,
      windDirection: acc.windDirection + point.windDirection,
      temperature: acc.temperature + point.temperature,
      vibration: acc.vibration + point.vibration,
    }),
    { power: 0, wind: 0, windDirection: 0, temperature: 0, vibration: 0 },
  );

  const statusCounts = source.reduce(
    (acc, point) => {
      acc[point.status] += 1;
      return acc;
    },
    { optimal: 0, warning: 0, critical: 0 },
  );

  const peakPower = Math.max(...source.map((point) => point.powerGenerated));
  const maxTemperature = Math.max(...source.map((point) => point.temperature));
  const maxVibration = Math.max(...source.map((point) => point.vibration));
  const warningCount = statusCounts.warning;
  const criticalCount = statusCounts.critical;
  const dominantStatus = (Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'optimal') as TelemetryState['status'];
  const operatingRate = (source.filter((point) => !point.brakingSystem).length / sampleCount) * 100;

  const trendWindow = source.slice(-Math.min(20, source.length));
  const trendBaseline = source.slice(0, Math.min(20, source.length));
  const average = (items: TelemetryState[], selector: (item: TelemetryState) => number) => {
    if (items.length === 0) return 0;
    return items.reduce((acc, item) => acc + selector(item), 0) / items.length;
  };

  const trend = {
    power: average(trendWindow, (item) => item.powerGenerated) - average(trendBaseline, (item) => item.powerGenerated),
    windSpeed: average(trendWindow, (item) => item.windSpeed) - average(trendBaseline, (item) => item.windSpeed),
    windDirection: average(trendWindow, (item) => item.windDirection) - average(trendBaseline, (item) => item.windDirection),
    temperature: average(trendWindow, (item) => item.temperature) - average(trendBaseline, (item) => item.temperature),
    vibration: average(trendWindow, (item) => item.vibration) - average(trendBaseline, (item) => item.vibration),
  };

  const recommendations: string[] = [];

  if (criticalCount > 0) {
    recommendations.push('Keep the emergency brake available and investigate the vibration and temperature drivers immediately.');
  }

  if (maxTemperature > 82) {
    recommendations.push('Increase blade pitch during high load to reduce thermal stress.');
  }

  if (maxVibration > 4.5) {
    recommendations.push('Check rotor balance and yaw alignment to reduce structural oscillation.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Current operating conditions are stable; maintain the present setpoints and continue monitoring.');
  }

  return {
    generatedAt: Date.now(),
    sampleCount,
    averagePower: sum.power / sampleCount,
    peakPower,
    averageWindSpeed: sum.wind / sampleCount,
    maxTemperature,
    maxVibration,
    warningCount,
    criticalCount,
    operatingRate,
    dominantStatus,
    trend,
    recommendations,
    recentAlerts: alertFeed.slice(0, 10),
    environment: {
      ambientTemperature: source[source.length - 1].ambientTemperature,
      airDensity: source[source.length - 1].airDensity,
      turbulence: source[source.length - 1].turbulence,
      windDirection: source[source.length - 1].windDirection,
    },
  };
}

async function persistHistory() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(HISTORY_FILE, JSON.stringify(telemetryHistory, null, 2), 'utf-8');
}

async function loadHistory() {
  try {
    const raw = await readFile(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      telemetryHistory = parsed.filter((entry) => entry && typeof entry.timestamp === 'number').slice(-HISTORY_LIMIT);
      if (telemetryHistory.length > 0) {
        state = { ...state, ...telemetryHistory[telemetryHistory.length - 1] };
      }
    }
  } catch {
    telemetryHistory = [];
  }
}

async function refreshAiReport(force = false) {
  const now = Date.now();

  if (!force && cachedAiReport && now - lastAiRefresh < AI_REFRESH_MS) {
    return cachedAiReport;
  }

  if (aiRefreshPromise) {
    await aiRefreshPromise;
    return cachedAiReport ?? buildFallbackAiReport(state, 'AI report is still generating.');
  }

  const snapshot = { ...state };

  aiRefreshPromise = (async () => {
    if (!process.env.GEMINI_API_KEY) {
      cachedAiReport = buildFallbackAiReport(snapshot, 'No Gemini API key is configured.');
      lastAiRefresh = Date.now();
      return;
    }

    try {
      const prompt = `
You are an AI diagnostic agent for a Smart Wind Turbine Digital Twin.
Analyze the following real-time telemetry data and provide a short diagnostic report in JSON only.

Telemetry:
- Wind Speed: ${snapshot.windSpeed.toFixed(2)} m/s
- Wind Direction: ${snapshot.windDirection.toFixed(2)} degrees
- Air Density: ${snapshot.airDensity.toFixed(3)} kg/m^3
- Ambient Temperature: ${snapshot.ambientTemperature.toFixed(2)} °C
- Turbulence: ${snapshot.turbulence.toFixed(2)}
- Rotor Speed: ${snapshot.rotorSpeed.toFixed(2)} RPM
- Power Generated: ${snapshot.powerGenerated.toFixed(2)} MW
- Temperature: ${snapshot.temperature.toFixed(2)} °C
- Vibration: ${snapshot.vibration.toFixed(2)} mm/s
- Blade Pitch: ${snapshot.bladePitch.toFixed(2)} degrees
- Yaw: ${snapshot.yaw.toFixed(2)} degrees
- Status: ${snapshot.status}
- AI Auto Mode: ${snapshot.aiAutoMode ? 'Enabled' : 'Disabled'}
- Braking System: ${snapshot.brakingSystem ? 'Engaged' : 'Disengaged'}

Return valid JSON with the keys:
- analysis: short explanation of the current system state
- recommendation: the next action to take
- healthScore: number from 0 to 100
Keep the response concise and practical.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      cachedAiReport = {
        analysis: String(parsed.analysis ?? 'The system is operating with no additional AI summary available.'),
        recommendation: String(parsed.recommendation ?? 'Continue monitoring the turbine telemetry.'),
        healthScore: clamp(Number(parsed.healthScore ?? 0), 0, 100),
        generatedAt: Date.now(),
        source: 'gemini',
      };
      lastAiRefresh = Date.now();
    } catch (error) {
      console.error('AI Error:', error);
      cachedAiReport = buildFallbackAiReport(snapshot, 'The remote AI call failed, so a local diagnostic fallback is being used.');
      lastAiRefresh = Date.now();
    }
  })().finally(() => {
    aiRefreshPromise = null;
  });

  await aiRefreshPromise;
  return cachedAiReport ?? buildFallbackAiReport(snapshot, 'No AI report is available.');
}

function updateEnvironmentalState() {
  state.windSpeed = clamp(state.windSpeed + (Math.random() - 0.5) * (0.5 + state.turbulence), 0, 35);
  state.windDirection = wrapAngle(state.windDirection + (Math.random() - 0.5) * (2 + state.turbulence * 18));
  state.airDensity = clamp(state.airDensity + (Math.random() - 0.5) * 0.004, 1.0, 1.32);
  state.ambientTemperature = clamp(state.ambientTemperature + (Math.random() - 0.5) * 0.2, -10, 45);
  state.turbulence = clamp(state.turbulence + (Math.random() - 0.5) * 0.02, 0.02, 0.45);
}

setInterval(() => {
  const previousState = { ...state };

  if (!state.aiAutoMode) {
    updateEnvironmentalState();
  } else {
    state.windSpeed = clamp(state.windSpeed + (Math.random() - 0.5) * (0.35 + state.turbulence * 0.6), 0, 35);
    state.windDirection = wrapAngle(state.windDirection + (Math.random() - 0.5) * (1.5 + state.turbulence * 12));
  }

  const yawError = shortestAngleDifference(state.windDirection, state.yaw);
  const alignmentFactor = clamp(Math.cos((yawError * Math.PI) / 180), 0.08, 1);
  const pitchFactor = clamp(1 - state.bladePitch / 95, 0.08, 1);
  const turbulencePenalty = clamp(1 - state.turbulence * 0.45, 0.6, 1);
  const densityFactor = state.airDensity / 1.225;
  const windBeforeBrake = state.windSpeed * alignmentFactor * turbulencePenalty;

  if (state.aiAutoMode) {
    const targetPitch = state.windSpeed > 24 || state.turbulence > 0.24
      ? 34
      : state.windSpeed > 18
        ? 18
        : state.powerGenerated > 2.8
          ? 10
          : 0;
    state.bladePitch = clamp(approach(state.bladePitch, targetPitch, 1.5), 0, 90);

    const targetYaw = wrapAngle(state.windDirection);
    const currentYaw = state.yaw;
    const yawStep = shortestAngleDifference(targetYaw, currentYaw);
    state.yaw = wrapAngle(currentYaw + clamp(yawStep, -3, 3));
  }

  const effectiveWind = Math.max(0, windBeforeBrake * pitchFactor);
  const cp = clamp(0.48 - state.bladePitch * 0.0035 - state.turbulence * 0.12, 0.08, 0.48);
  const rotorTargetSpeed = state.brakingSystem ? 0 : effectiveWind * 9.2 * alignmentFactor * (0.8 + cp);

  state.rotorSpeed += (rotorTargetSpeed - state.rotorSpeed) * (state.brakingSystem ? 0.22 : 0.09);
  if (state.brakingSystem) {
    state.rotorSpeed *= 0.78;
  }
  state.rotorSpeed = clamp(state.rotorSpeed + (Math.random() - 0.5) * (0.08 + state.turbulence * 0.12), 0, 44);

  const aerodynamicPower = 0.5 * state.airDensity * ROTOR_AREA_M2 * Math.pow(effectiveWind, 3) * cp;
  const powerMW = clamp((aerodynamicPower / 1_000_000) * densityFactor, 0, RATED_POWER_MW * 1.08);
  state.powerGenerated = state.brakingSystem ? 0 : powerMW;

  const heatingFromLoad = state.powerGenerated * 3.1 + Math.max(0, state.rotorSpeed - 16) * 0.16 + state.turbulence * 2.3;
  const cooling = (state.temperature - state.ambientTemperature) * 0.07 + state.windSpeed * 0.03;
  state.temperature = clamp(state.temperature + heatingFromLoad - cooling + (state.brakingSystem ? 1.4 : 0), state.ambientTemperature, 110);

  state.vibration = clamp(
    0.8
      + Math.pow(state.rotorSpeed / 18, 1.7) * 0.55
      + state.turbulence * 4.2
      + Math.abs(yawError) / 180 * 1.15
      + (state.brakingSystem ? 1.35 : 0),
    0.8,
    10,
  );

  if (state.temperature > 96 || state.vibration > 6.5) {
    state.status = 'critical';
  } else if (state.temperature > 84 || state.vibration > 4.4 || state.windSpeed > 25 || Math.abs(yawError) > 35) {
    state.status = 'warning';
  } else {
    state.status = 'optimal';
  }

  if (state.aiAutoMode) {
    if (state.windSpeed > 30 || state.temperature > 94 || state.vibration > 5.8 || Math.abs(yawError) > 55) {
      state.brakingSystem = true;
    } else if (state.brakingSystem && state.windSpeed < 24 && state.temperature < 82 && state.vibration < 4.2) {
      state.brakingSystem = false;
    }
  }

  if (state.status !== previousState.status) {
    createAlert(
      state.status === 'critical' ? 'critical' : 'warning',
      `Status changed from ${previousState.status} to ${state.status}.`,
    );
  }

  if (state.brakingSystem !== previousState.brakingSystem) {
    createAlert(
      state.brakingSystem ? 'warning' : 'info',
      state.brakingSystem ? 'Braking system engaged automatically.' : 'Braking system released after safe conditions returned.',
    );
  }

  state.timestamp = Date.now();
  telemetryHistory.push({ ...state });
  telemetryHistory = telemetryHistory.slice(-HISTORY_LIMIT);
  io.emit('telemetry', { ...state });

  if (Date.now() - lastPersistAt > 5000) {
    lastPersistAt = Date.now();
    void persistHistory().catch((error) => console.error('Failed to persist telemetry history:', error));
  }

  if (state.status !== 'optimal' || state.temperature > 82 || state.vibration > 4.3) {
    void refreshAiReport(false).catch((error) => console.error('Failed to refresh AI report:', error));
  }
}, 1000);

app.get('/api/state', (req, res) => {
  res.json(state);
});

app.get('/api/history', (req, res) => {
  const requestedLimit = Number.parseInt(String(req.query.limit ?? '120'), 10);
  const limit = clamp(Number.isNaN(requestedLimit) ? 120 : requestedLimit, 1, HISTORY_LIMIT);
  res.json(telemetryHistory.slice(-limit));
});

app.get('/api/reports', (req, res) => {
  res.json({
    session: buildSystemReport(telemetryHistory),
    alerts: alertFeed.slice(0, 10),
    ai: cachedAiReport,
  });
});

app.post('/api/control', (req, res) => {
  const {
    bladePitch,
    yaw,
    brakingSystem,
    aiAutoMode,
    windSpeed,
    windDirection,
    airDensity,
    ambientTemperature,
    turbulence,
  } = req.body;

  const previousBrakeState = state.brakingSystem;
  const previousAutoMode = state.aiAutoMode;

  if (typeof bladePitch === 'number') state.bladePitch = clamp(bladePitch, 0, 90);
  if (typeof yaw === 'number') state.yaw = wrapAngle(yaw);
  if (typeof brakingSystem === 'boolean') state.brakingSystem = brakingSystem;
  if (typeof aiAutoMode === 'boolean') state.aiAutoMode = aiAutoMode;
  if (typeof windSpeed === 'number') state.windSpeed = clamp(windSpeed, 0, 35);
  if (typeof windDirection === 'number') state.windDirection = wrapAngle(windDirection);
  if (typeof airDensity === 'number') state.airDensity = clamp(airDensity, 1.0, 1.32);
  if (typeof ambientTemperature === 'number') state.ambientTemperature = clamp(ambientTemperature, -10, 45);
  if (typeof turbulence === 'number') state.turbulence = clamp(turbulence, 0.02, 0.45);

  if (previousAutoMode !== state.aiAutoMode) {
    createAlert('info', `AI Auto Mode ${state.aiAutoMode ? 'enabled' : 'disabled'} by operator.`);
  }

  if (previousBrakeState !== state.brakingSystem) {
    createAlert(state.brakingSystem ? 'warning' : 'info', `Emergency braking ${state.brakingSystem ? 'engaged' : 'released'} manually.`);
  }

  res.json(state);
});

app.get('/api/predict', async (req, res) => {
  try {
    const report = await refreshAiReport(true);
    res.json(report);
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate AI prediction.' });
  }
});

async function startServer() {
  await loadHistory();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/.runtime/**', '**/data/**', '**/.env', '**/telemetry-history.json'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();