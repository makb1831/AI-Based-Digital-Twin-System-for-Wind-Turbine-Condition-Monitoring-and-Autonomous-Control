import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import ControlPanel from './components/ControlPanel';
import DigitalTwin3D from './components/DigitalTwin3D';
import AIInsights from './components/AIInsights';
import Sidebar from './components/Sidebar';
import { AIDiagnosticReport, AlertEvent, SystemReport, TelemetryState } from './types';

const socket = io();

interface ReportsPayload {
  session: SystemReport;
  alerts: AlertEvent[];
  ai: AIDiagnosticReport | null;
}

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [history, setHistory] = useState<TelemetryState[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [sessionReport, setSessionReport] = useState<SystemReport | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [latestAiReport, setLatestAiReport] = useState<AIDiagnosticReport | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      try {
        const [stateResponse, historyResponse, reportsResponse] = await Promise.all([
          fetch('/api/state'),
          fetch('/api/history?limit=80'),
          fetch('/api/reports'),
        ]);

        if (stateResponse.ok) {
          const stateData = await stateResponse.json() as TelemetryState;
          if (isMounted) {
            setTelemetry(stateData);
          }
        }

        if (historyResponse.ok) {
          const historyData = await historyResponse.json() as TelemetryState[];
          if (isMounted) {
            setHistory(historyData);
          }
        }

        if (reportsResponse.ok) {
          const reportData = await reportsResponse.json() as ReportsPayload;
          if (isMounted) {
            setSessionReport(reportData.session);
            setAlerts(reportData.alerts ?? []);
            setLatestAiReport(reportData.ai);
          }
        }
      } catch (error) {
        console.error('Failed to load initial snapshot:', error);
      } finally {
        if (isMounted) {
          setLoadingSnapshot(false);
        }
      }
    };

    const refreshReports = async () => {
      try {
        const response = await fetch('/api/reports');
        if (!response.ok) return;

        const reportData = await response.json() as ReportsPayload;
        if (isMounted) {
          setSessionReport(reportData.session);
          setAlerts(reportData.alerts ?? []);
          setLatestAiReport(reportData.ai);
        }
      } catch (error) {
        console.error('Failed to refresh reports:', error);
      }
    };

    socket.on('telemetry', (data: TelemetryState) => {
      setTelemetry(data);
      setHistory((previousHistory) => {
        const nextHistory = [...previousHistory, data].slice(-80);
        return nextHistory;
      });
    });

    void loadSnapshot();
    const reportTimer = window.setInterval(refreshReports, 20000);

    return () => {
      isMounted = false;
      socket.off('telemetry');
      window.clearInterval(reportTimer);
    };
  }, []);

  if (loadingSnapshot && !telemetry) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-mono">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!telemetry) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="px-6 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Aura Twin
            </h1>
            <p className="text-sm text-slate-400">Smart Turbine Digital Twin</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${telemetry.status === 'optimal' ? 'bg-emerald-400' : telemetry.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${telemetry.status === 'optimal' ? 'bg-emerald-500' : telemetry.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-mono text-sm capitalize">
              System: {telemetry.status}
            </span>
          </div>
        </header>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {activeTab === 'dashboard' ? (
            <>
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden h-[450px] relative shadow-2xl">
                  <div className="absolute top-4 left-4 z-10 bg-slate-950/80 px-3 py-1.5 rounded-md border border-white/10 backdrop-blur-md">
                    <h2 className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Live Simulation</h2>
                    <div className="font-mono text-sm text-cyan-400">Rotor RPM: {telemetry.rotorSpeed.toFixed(1)}</div>
                  </div>
                  <DigitalTwin3D state={telemetry} />
                </div>

                <AIInsights state={telemetry} cachedReport={latestAiReport} />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <Dashboard data={telemetry} history={history} />
                <ControlPanel state={telemetry} />
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 space-y-6">
              <div className="p-8 border border-white/10 rounded-xl bg-slate-900/50">
                <h2 className="text-2xl font-semibold mb-3 text-white">System Reports</h2>
                <p className="text-slate-400 mb-6">Persisted session data, live alerts, and AI summaries from the digital twin.</p>

                {sessionReport ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Average Power</div>
                      <div className="text-2xl font-bold text-cyan-300">{sessionReport.averagePower.toFixed(2)} MW</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Peak Power</div>
                      <div className="text-2xl font-bold text-cyan-300">{sessionReport.peakPower.toFixed(2)} MW</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Operating Rate</div>
                      <div className="text-2xl font-bold text-emerald-300">{sessionReport.operatingRate.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Dominant Status</div>
                      <div className={`text-2xl font-bold capitalize ${sessionReport.dominantStatus === 'critical' ? 'text-red-300' : sessionReport.dominantStatus === 'warning' ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {sessionReport.dominantStatus}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Average Wind</div>
                      <div className="text-2xl font-bold text-sky-300">{sessionReport.averageWindSpeed.toFixed(1)} m/s</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Max Temperature</div>
                      <div className="text-2xl font-bold text-amber-300">{sessionReport.maxTemperature.toFixed(1)} °C</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Max Vibration</div>
                      <div className="text-2xl font-bold text-violet-300">{sessionReport.maxVibration.toFixed(2)} mm/s</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Alert Count</div>
                      <div className="text-2xl font-bold text-red-300">{sessionReport.criticalCount + sessionReport.warningCount}</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Ambient Temp</div>
                      <div className="text-2xl font-bold text-amber-300">{sessionReport.environment.ambientTemperature.toFixed(1)} °C</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Air Density</div>
                      <div className="text-2xl font-bold text-sky-300">{sessionReport.environment.airDensity.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Turbulence</div>
                      <div className="text-2xl font-bold text-violet-300">{sessionReport.environment.turbulence.toFixed(2)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-white/5 p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Wind Direction</div>
                      <div className="text-2xl font-bold text-cyan-300">{sessionReport.environment.windDirection.toFixed(0)}°</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Waiting for report data...</p>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-white/10 bg-slate-900/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {sessionReport?.recommendations?.length ? sessionReport.recommendations.map((item, index) => (
                      <div key={index} className="rounded-lg border border-white/5 bg-slate-950/80 p-3 text-sm text-slate-300">
                        {item}
                      </div>
                    )) : <p className="text-slate-500 text-sm">No recommendation available yet.</p>}
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-slate-900/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {alerts.length ? alerts.map((alert) => (
                      <div key={alert.id} className="rounded-lg border border-white/5 bg-slate-950/80 p-3">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-xs uppercase tracking-wider font-semibold ${alert.type === 'critical' ? 'text-red-300' : alert.type === 'warning' ? 'text-amber-300' : 'text-cyan-300'}`}>
                            {alert.type}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-300">{alert.message}</p>
                      </div>
                    )) : <p className="text-slate-500 text-sm">No alerts yet.</p>}
                  </div>
                </div>

                <div className="xl:col-span-2 p-6 rounded-xl border border-white/10 bg-slate-900/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Latest AI Summary</h3>
                  {latestAiReport ? (
                    <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-5 text-center">
                        <div className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Health Score</div>
                        <div className="text-5xl font-bold text-indigo-200">{Math.round(latestAiReport.healthScore)}</div>
                        <div className="mt-3 text-xs text-slate-400">Source: {latestAiReport.source}</div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Analysis</div>
                          <p className="text-sm leading-relaxed text-slate-300 bg-slate-950/80 border border-white/5 rounded-lg p-4">{latestAiReport.analysis}</p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Recommendation</div>
                          <p className="text-sm leading-relaxed text-slate-300 bg-slate-950/80 border border-white/5 rounded-lg p-4">{latestAiReport.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">No AI summary available yet.</p>
                  )}
                </div>

                <div className="xl:col-span-2 rounded-xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 mb-3">
                    <span className="text-xs uppercase tracking-wider font-semibold">Session Stats</span>
                    <span className="font-mono">Samples: {sessionReport.sampleCount}</span>
                    <span className="font-mono">Generated: {new Date(sessionReport.generatedAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="leading-relaxed">
                    This twin is smart because it combines a live turbine state model, operator controls, automatic safety logic, and AI diagnostics.
                    The turbine behavior responds to real variables such as wind speed, wind direction, air density, turbulence, pitch, yaw, and braking,
                    so the simulation is not just cosmetic. The AI layer explains risk and health while the control loop can change system behavior.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}