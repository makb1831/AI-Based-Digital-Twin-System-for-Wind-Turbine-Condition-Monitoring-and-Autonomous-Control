import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import ControlPanel from './components/ControlPanel';
import DigitalTwin3D from './components/DigitalTwin3D';
import AIInsights from './components/AIInsights';
import Sidebar from './components/Sidebar';
import { TelemetryState } from './types';

// Use same port relative path for socket
const socket = io();

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [history, setHistory] = useState<TelemetryState[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  useEffect(() => {
    socket.on('telemetry', (data: TelemetryState) => {
      setTelemetry(data);
      setHistory(prev => {
        const newHistory = [...prev, data];
        if (newHistory.length > 50) newHistory.shift(); // Keep last 50 points
        return newHistory;
      });
    });

    return () => {
      socket.off('telemetry');
    };
  }, []);

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-mono">Initializing System...</p>
        </div>
      </div>
    );
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
              {/* Left Column: 3D Visualization & AI Insights */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden h-[450px] relative shadow-2xl">
                  <div className="absolute top-4 left-4 z-10 bg-slate-950/80 px-3 py-1.5 rounded-md border border-white/10 backdrop-blur-md">
                    <h2 className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Live Simulation</h2>
                    <div className="font-mono text-sm text-cyan-400">Rotor RPM: {telemetry.rotorSpeed.toFixed(1)}</div>
                  </div>
                  <DigitalTwin3D state={telemetry} />
                </div>
                
                <AIInsights state={telemetry} />
              </div>

              {/* Right Column: Telemetry & Controls */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Dashboard data={telemetry} history={history} />
                <ControlPanel state={telemetry} />
              </div>
             </>
          ) : (
            <div className="lg:col-span-12 p-8 border border-white/10 rounded-xl bg-slate-900/50">
              <h2 className="text-2xl font-semibold mb-4 text-white">System Reports</h2>
              <p className="text-slate-400 mb-6">Historical data and AI-generated performance reports.</p>
              {/* Placeholder for reports */}
              <div className="bg-slate-950 rounded-lg p-6 border border-white/5 font-mono text-sm text-slate-300">
                <div className="grid grid-cols-4 gap-4 pb-2 border-b border-white/10 mb-2 font-bold">
                  <div>Timestamp</div>
                  <div>Avg Power</div>
                  <div>Max Temp</div>
                  <div>Status</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-2 opacity-80">
                    <div>{new Date(Date.now() - i * 86400000).toISOString().split('T')[0]}</div>
                    <div>{(1.1 + Math.random() * 0.3).toFixed(2)} MW</div>
                    <div>{(60 + Math.random() * 20).toFixed(1)} °C</div>
                    <div className={i % 3 === 0 && i !== 0 ? 'text-amber-400' : 'text-emerald-400'}>{i % 3 === 0 && i !== 0 ? 'Warning' : 'Optimal'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
