import { useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { ArrowRight, BrainCircuit, FileText, Gauge, LayoutDashboard, Radar, SlidersHorizontal, Sparkles, Wind } from 'lucide-react';
import AIInsights from './components/AIInsights';
import ControlPanel from './components/ControlPanel';
import Dashboard from './components/Dashboard';
import DigitalTwin3D from './components/DigitalTwin3D';
import { AIDiagnosticReport, AlertEvent, SystemReport, TelemetryState } from './types';

const socket = io();

type RouteName = 'overview' | 'turbine' | 'metrics' | 'controls' | 'ai' | 'reports';

interface ReportsPayload {
  session: SystemReport;
  alerts: AlertEvent[];
  ai: AIDiagnosticReport | null;
}

const routeItems: Array<{ route: RouteName; label: string; icon: typeof LayoutDashboard }> = [
  { route: 'overview', label: 'Overview', icon: LayoutDashboard },
  { route: 'turbine', label: 'Turbine', icon: Wind },
  { route: 'metrics', label: 'Metrics', icon: Gauge },
  { route: 'controls', label: 'Controls', icon: SlidersHorizontal },
  { route: 'ai', label: 'AI', icon: BrainCircuit },
  { route: 'reports', label: 'Reports', icon: FileText },
];

function pathForRoute(route: RouteName) {
  return `/${route}`;
}

function resolveRoute(pathname: string): RouteName {
  switch (pathname.replace(/\/+$/, '')) {
    case '/turbine':
      return 'turbine';
    case '/metrics':
      return 'metrics';
    case '/controls':
      return 'controls';
    case '/ai':
      return 'ai';
    case '/reports':
      return 'reports';
    case '/overview':
    case '':
    case '/':
    default:
      return 'overview';
  }
}

function StatCard({
  label,
  value,
  detail,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';
}) {
  const toneClasses = {
    cyan: 'text-cyan-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    violet: 'text-violet-300',
    rose: 'text-rose-300',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.35)]">
      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClasses}`}>{value}</div>
      {detail ? <div className="mt-1 text-sm text-slate-400">{detail}</div> : null}
    </div>
  );
}

function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-cyan-300/80">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}

function ReportsPage({
  telemetry,
  sessionReport,
  alerts,
  latestAiReport,
}: {
  telemetry: TelemetryState;
  sessionReport: SystemReport | null;
  alerts: AlertEvent[];
  latestAiReport: AIDiagnosticReport | null;
}) {
  return (
    <PageShell
      eyebrow="Report view"
      title="Session report and alert stream"
      subtitle="Use this page for the final report screenshots: it collects operating statistics, alerts, recommendations, and the latest AI summary in one place."
      action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/reports</div>}
    >
      <section className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Session summary</div>
            <p className="mt-2 text-sm text-slate-400">Persisted telemetry, alert trends, and AI diagnostics captured from the live system.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-2"><div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">State</div><div className="mt-1 capitalize text-slate-200">{telemetry.status}</div></div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-2"><div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Auto mode</div><div className="mt-1 text-slate-200">{telemetry.aiAutoMode ? 'Enabled' : 'Manual'}</div></div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-2"><div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Brake</div><div className="mt-1 text-slate-200">{telemetry.brakingSystem ? 'Engaged' : 'Released'}</div></div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-2"><div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Wind</div><div className="mt-1 text-slate-200">{telemetry.windSpeed.toFixed(1)} m/s</div></div>
          </div>
        </div>

        {sessionReport ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Average power" value={`${sessionReport.averagePower.toFixed(2)} MW`} tone="cyan" />
            <StatCard label="Peak power" value={`${sessionReport.peakPower.toFixed(2)} MW`} tone="emerald" />
            <StatCard label="Operating rate" value={`${sessionReport.operatingRate.toFixed(1)}%`} tone="amber" />
            <StatCard label="Dominant status" value={sessionReport.dominantStatus} tone={sessionReport.dominantStatus === 'critical' ? 'rose' : sessionReport.dominantStatus === 'warning' ? 'amber' : 'emerald'} />
            <StatCard label="Average wind" value={`${sessionReport.averageWindSpeed.toFixed(1)} m/s`} tone="cyan" />
            <StatCard label="Max temperature" value={`${sessionReport.maxTemperature.toFixed(1)} °C`} tone="amber" />
            <StatCard label="Max vibration" value={`${sessionReport.maxVibration.toFixed(2)} mm/s`} tone="violet" />
            <StatCard label="Alert count" value={`${sessionReport.warningCount + sessionReport.criticalCount}`} tone="rose" />
          </div>
        ) : <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-400">Waiting for report data...</div>}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Recommendations</h3>
            <p className="mt-1 text-sm text-slate-400">Actions generated from the current operating state.</p>
          </div>
          <div className="mt-4 space-y-3">
            {sessionReport?.recommendations?.length ? sessionReport.recommendations.map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                {item}
              </div>
            )) : <div className="text-sm text-slate-500">No recommendation available yet.</div>}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent alerts</h3>
            <p className="mt-1 text-sm text-slate-400">Operational events recorded during the session.</p>
          </div>
          <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {alerts.length ? alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs uppercase tracking-[0.28em] ${alert.type === 'critical' ? 'text-rose-300' : alert.type === 'warning' ? 'text-amber-300' : 'text-cyan-300'}`}>{alert.type}</span>
                  <span className="font-mono text-[11px] text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{alert.message}</p>
              </div>
            )) : <div className="text-sm text-slate-500">No alerts yet.</div>}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Latest AI summary</h3>
            <p className="mt-1 text-sm text-slate-400">Use this block when you want the final AI result in the report.</p>
          </div>
          {latestAiReport ? (
            <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="rounded-[24px] border border-cyan-500/15 bg-cyan-500/8 p-5 text-center">
                <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Health score</div>
                <div className="mt-4 text-5xl font-semibold text-cyan-100">{Math.round(latestAiReport.healthScore)}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.28em] text-cyan-200/70">{latestAiReport.source}</div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Analysis</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{latestAiReport.analysis}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Recommendation</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{latestAiReport.recommendation}</p>
                </div>
              </div>
            </div>
          ) : <div className="mt-4 text-sm text-slate-500">No AI summary available yet.</div>}
        </section>
      </div>
    </PageShell>
  );
}

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [history, setHistory] = useState<TelemetryState[]>([]);
  const [sessionReport, setSessionReport] = useState<SystemReport | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [latestAiReport, setLatestAiReport] = useState<AIDiagnosticReport | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [route, setRoute] = useState<RouteName>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    if (window.location.pathname === '/' || !['/overview', '/turbine', '/metrics', '/controls', '/ai', '/reports'].includes(window.location.pathname)) {
      window.history.replaceState({}, '', pathForRoute(resolveRoute(window.location.pathname)));
    }

    const handlePopState = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
          if (isMounted) setTelemetry(stateData);
        }

        if (historyResponse.ok) {
          const historyData = await historyResponse.json() as TelemetryState[];
          if (isMounted) setHistory(historyData);
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
        if (isMounted) setLoadingSnapshot(false);
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
      setHistory((previous) => [...previous, data].slice(-80));
    });

    void loadSnapshot();
    const reportTimer = window.setInterval(refreshReports, 20000);

    return () => {
      isMounted = false;
      socket.off('telemetry');
      window.clearInterval(reportTimer);
    };
  }, []);

  const navigateTo = (nextRoute: RouteName) => {
    if (route === nextRoute) return;
    window.history.pushState({}, '', pathForRoute(nextRoute));
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loadingSnapshot && !telemetry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 px-8 py-7 text-center shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="mt-4 text-sm uppercase tracking-[0.32em] text-slate-400">Initializing system</p>
        </div>
      </div>
    );
  }

  if (!telemetry) return null;

  const statusTone = telemetry.status === 'critical' ? 'text-rose-300' : telemetry.status === 'warning' ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-[30px] border border-white/10 bg-slate-950/80 px-5 py-4 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Aura Twin</p>
                  <h1 className="text-2xl font-semibold text-white">Wind turbine digital twin</h1>
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-400">Dedicated browser pages for screenshots, built around the live turbine simulation, controls, diagnostics, and reports.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2">
                <span className={`h-2.5 w-2.5 rounded-full ${telemetry.status === 'optimal' ? 'bg-emerald-400' : telemetry.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className={`text-sm font-medium capitalize ${statusTone}`}>System {telemetry.status}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">{pathForRoute(route)}</div>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
            {routeItems.map((item) => {
              const active = route === item.route;
              const Icon = item.icon;

              return (
                <a
                  key={item.route}
                  href={pathForRoute(item.route)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(item.route);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/15 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 pb-2">
          {route === 'overview' ? (
            <PageShell
              eyebrow="Landing page"
              title="Quick screenshot hub"
              subtitle="Use this page as the starting point when you need a clean top-level view of the system. Each other route isolates one screenshot target so you can capture them without extra clutter."
              action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/overview</div>}
            >
              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Live status</div>
                      <h3 className="mt-2 text-2xl font-semibold text-white">Current turbine state</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This is a concise entry screen that keeps the visual hierarchy calm and gives you a clean starting point before opening one of the dedicated screenshot pages.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      {latestAiReport ? `AI score ${Math.round(latestAiReport.healthScore)}` : 'AI report pending'}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Power output" value={`${telemetry.powerGenerated.toFixed(2)} MW`} tone="cyan" />
                    <StatCard label="Rotor speed" value={`${telemetry.rotorSpeed.toFixed(1)} RPM`} tone="emerald" />
                    <StatCard label="Temperature" value={`${telemetry.temperature.toFixed(1)} °C`} tone={telemetry.temperature > 96 ? 'rose' : telemetry.temperature > 84 ? 'amber' : 'cyan'} />
                    <StatCard label="Vibration" value={`${telemetry.vibration.toFixed(2)} mm/s`} tone={telemetry.vibration > 6.5 ? 'rose' : telemetry.vibration > 4.4 ? 'amber' : 'violet'} />
                  </div>

                  <div className="mt-6 rounded-[24px] border border-white/8 bg-slate-950/65 p-5">
                    <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Quick capture pages</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {routeItems.slice(1).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.route}
                            onClick={() => navigateTo(item.route)}
                            className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-cyan-400/20 hover:bg-cyan-400/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-cyan-300">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-white">{item.label}</div>
                                <div className="text-sm text-slate-400">{pathForRoute(item.route)}</div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
                    <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Session overview</div>
                    <div className="mt-4 space-y-3">
                      <StatCard label="Wind direction" value={`${telemetry.windDirection.toFixed(0)}°`} tone="cyan" />
                      <StatCard label="Air density" value={`${telemetry.airDensity.toFixed(3)} kg/m³`} tone="emerald" />
                      <StatCard label="Ambient temp" value={`${telemetry.ambientTemperature.toFixed(1)} °C`} tone="amber" />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-slate-900/55 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Current mode</div>
                        <div className="mt-2 text-lg font-semibold text-white">{telemetry.aiAutoMode ? 'Autonomous control' : 'Manual control'}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.28em] ${telemetry.brakingSystem ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                        {telemetry.brakingSystem ? 'Brake on' : 'Brake off'}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">Use the dedicated pages for screenshots when you want a focused capture of the turbine model, the charts, the control panel, the AI card, or the reports page.</p>
                  </div>
                </section>
              </div>
            </PageShell>
          ) : null}

          {route === 'turbine' ? (
            <PageShell
              eyebrow="Visualization"
              title="Full 3D turbine view"
              subtitle="This page isolates the Three.js scene so you can capture the rotor, yaw alignment, wind direction cue, and status lighting without other panels competing for attention."
              action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/turbine</div>}
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                <div className="rounded-[28px] border border-white/10 bg-slate-900/55 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
                  <div className="relative h-[78vh] min-h-[680px] overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/80">
                    <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
                      <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Rotor speed</div>
                      <div className="mt-1 font-mono text-lg text-cyan-300">{telemetry.rotorSpeed.toFixed(1)} RPM</div>
                    </div>
                    <DigitalTwin3D state={telemetry} />
                  </div>
                </div>

                <div className="space-y-4">
                  <StatCard label="Status" value={telemetry.status} tone={telemetry.status === 'critical' ? 'rose' : telemetry.status === 'warning' ? 'amber' : 'emerald'} />
                  <StatCard label="Yaw" value={`${telemetry.yaw.toFixed(0)}°`} tone="cyan" />
                  <StatCard label="Blade pitch" value={`${telemetry.bladePitch.toFixed(1)}°`} tone="violet" />
                  <StatCard label="Wind speed" value={`${telemetry.windSpeed.toFixed(1)} m/s`} tone="emerald" />
                  <StatCard label="Turbulence" value={telemetry.turbulence.toFixed(2)} tone="amber" />
                  <div className="rounded-[24px] border border-white/10 bg-slate-900/55 p-5 text-sm leading-6 text-slate-400">Use this page when you need a clean capture of the animation, especially if the rotor motion or yaw state needs to be visible in the report.</div>
                </div>
              </div>
            </PageShell>
          ) : null}

          {route === 'metrics' ? (
            <PageShell
              eyebrow="Telemetry"
              title="Live metrics and trend page"
              subtitle="The metrics view isolates the dashboard cards and the historical chart so you can capture operating values and short-term trends in a single screenshot."
              action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/metrics</div>}
            >
              <Dashboard data={telemetry} history={history} />
            </PageShell>
          ) : null}

          {route === 'controls' ? (
            <PageShell
              eyebrow="Operator panel"
              title="Control page for manual input"
              subtitle="This page is dedicated to the environmental sliders, turbine controls, auto mode switch, and braking toggle so the screenshot shows the operator workflow clearly."
              action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/controls</div>}
            >
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <div className="space-y-4">
                  <StatCard label="Current power" value={`${telemetry.powerGenerated.toFixed(2)} MW`} tone="cyan" />
                  <StatCard label="Yaw error" value={`${Math.abs(((telemetry.windDirection - telemetry.yaw + 540) % 360) - 180).toFixed(1)}°`} tone="amber" />
                  <StatCard label="Mode" value={telemetry.aiAutoMode ? 'Autonomous' : 'Manual'} tone={telemetry.aiAutoMode ? 'emerald' : 'violet'} />
                  <div className="rounded-[24px] border border-white/10 bg-slate-900/55 p-5 text-sm leading-6 text-slate-400">Capture this page when the slider values are visible. It is the cleanest view for proving manual control, auto mode, and braking behavior.</div>
                </div>
                <ControlPanel state={telemetry} />
              </div>
            </PageShell>
          ) : null}

          {route === 'ai' ? (
            <PageShell
              eyebrow="Diagnostics"
              title="AI summary and health card"
              subtitle="This page isolates the diagnostic panel so the health score, analysis text, and recommendation are the only focus in the screenshot."
              action={<div className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-400">/ai</div>}
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <AIInsights state={telemetry} cachedReport={latestAiReport} />
                <div className="space-y-4">
                  <StatCard label="Health score" value={latestAiReport ? `${Math.round(latestAiReport.healthScore)}/100` : 'Pending'} tone={latestAiReport && latestAiReport.healthScore > 75 ? 'emerald' : latestAiReport && latestAiReport.healthScore > 45 ? 'amber' : 'rose'} />
                  <StatCard label="AI source" value={latestAiReport?.source ?? 'cache / fallback'} tone="cyan" />
                  <StatCard label="Updated" value={latestAiReport ? new Date(latestAiReport.generatedAt).toLocaleTimeString() : '--'} tone="violet" />
                  <div className="rounded-[24px] border border-white/10 bg-slate-900/55 p-5 text-sm leading-6 text-slate-400">If you want a stronger screenshot, wait for the score to settle on a warning or critical state and then capture this page again.</div>
                </div>
              </div>
            </PageShell>
          ) : null}

          {route === 'reports' ? <ReportsPage telemetry={telemetry} sessionReport={sessionReport} alerts={alerts} latestAiReport={latestAiReport} /> : null}
        </main>
      </div>
    </div>
  );
}
