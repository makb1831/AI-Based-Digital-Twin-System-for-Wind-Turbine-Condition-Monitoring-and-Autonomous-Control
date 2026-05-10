import { TelemetryState } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: TelemetryState;
  history: TelemetryState[];
}

export default function Dashboard({ data, history }: DashboardProps) {
  // Setup data format for chart
  const formattedHistory = history.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
    power: parseFloat(point.powerGenerated.toFixed(2)),
    wind: parseFloat(point.windSpeed.toFixed(2)),
  }));
  const yawError = Math.abs(((data.windDirection - data.yaw + 540) % 360) - 180);

  const MetricCard = ({ label, value, unit, status }: { label: string, value: string, unit: string, status?: 'optimal' | 'warning' | 'critical' }) => {
    let colorClass = "text-slate-200";
    if (status === 'warning') colorClass = "text-amber-400";
    if (status === 'critical') colorClass = "text-red-400";

    return (
      <div className="bg-slate-900/40 border border-white/10 p-4 rounded-lg flex flex-col justify-between">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</span>
          <span className="text-sm text-slate-500 font-mono">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-xl shadow-xl flex flex-col gap-6 min-w-0">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
        Real-Time Metrics
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Wind Speed" value={data.windSpeed.toFixed(1)} unit="m/s" status={data.windSpeed > 25 ? 'warning' : 'optimal'} />
        <MetricCard label="Power Output" value={data.powerGenerated.toFixed(2)} unit="MW" />
        <MetricCard label="Temperature" value={data.temperature.toFixed(1)} unit="°C" status={data.temperature > 100 ? 'critical' : data.temperature > 85 ? 'warning' : 'optimal'} />
        <MetricCard label="Vibration" value={data.vibration.toFixed(2)} unit="mm/s" status={data.vibration > 6 ? 'critical' : data.vibration > 4 ? 'warning' : 'optimal'} />
        <MetricCard label="Wind Direction" value={data.windDirection.toFixed(0)} unit="°" />
        <MetricCard label="Air Density" value={data.airDensity.toFixed(3)} unit="kg/m³" />
        <MetricCard label="Ambient Temp" value={data.ambientTemperature.toFixed(1)} unit="°C" />
        <MetricCard label="Turbulence" value={data.turbulence.toFixed(2)} unit="" status={data.turbulence > 0.28 ? 'warning' : 'optimal'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Yaw Alignment</div>
          <div className={`text-2xl font-bold font-mono ${yawError > 35 ? 'text-amber-400' : 'text-emerald-300'}`}>{yawError.toFixed(1)}°</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Auto Mode</div>
          <div className="text-2xl font-bold font-mono text-cyan-300">{data.aiAutoMode ? 'Enabled' : 'Manual'}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Brake State</div>
          <div className={`text-2xl font-bold font-mono ${data.brakingSystem ? 'text-red-400' : 'text-emerald-300'}`}>{data.brakingSystem ? 'Engaged' : 'Released'}</div>
        </div>
      </div>

      <div className="h-64 mt-4 bg-slate-950/50 rounded-lg p-4 border border-white/5 relative min-w-0 min-h-0">
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-slate-400">Power and Wind Trend</div>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={formattedHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
              itemStyle={{ color: '#22d3ee' }}
            />
            <Line type="monotone" dataKey="power" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="wind" stroke="#60a5fa" strokeWidth={1.5} dot={false} strokeDasharray="4 4" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
