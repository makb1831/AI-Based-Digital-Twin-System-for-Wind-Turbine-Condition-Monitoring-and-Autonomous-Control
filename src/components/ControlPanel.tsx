import { useState, useEffect } from 'react';
import { TelemetryState } from '../types';

interface ControlPanelProps {
  state: TelemetryState;
}

export default function ControlPanel({ state }: ControlPanelProps) {
  // Use local state for immediate UI feedback, sync when props change significantly
  const [localPitch, setLocalPitch] = useState(state.bladePitch);
  const [localYaw, setLocalYaw] = useState(state.yaw);
  
  // Debounce API calls for sliders
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Math.abs(localPitch - state.bladePitch) > 1 || Math.abs(localYaw - state.yaw) > 1) {
        updateControl({ bladePitch: localPitch, yaw: localYaw });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localPitch, localYaw]);

  // Sync back from server if AI changed it
  useEffect(() => {
    if (state.aiAutoMode) {
      setLocalPitch(state.bladePitch);
    }
  }, [state.bladePitch, state.aiAutoMode]);

  const updateControl = async (updates: Partial<TelemetryState>) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error("Failed to update controls", e);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-xl shadow-xl flex flex-col gap-6 flex-1">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          System Controls
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">AI Auto Mode</span>
          <button 
            onClick={() => updateControl({ aiAutoMode: !state.aiAutoMode })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 \${
              state.aiAutoMode ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                state.aiAutoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Blade Pitch (Degrees)</span>
            <span className="font-mono">{localPitch.toFixed(1)}°</span>
          </div>
          <input 
            type="range" 
            min="0" max="90" step="1"
            disabled={state.aiAutoMode}
            value={localPitch}
            onChange={(e) => setLocalPitch(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Nacelle Yaw (Degrees)</span>
            <span className="font-mono">{localYaw.toFixed(1)}°</span>
          </div>
          <input 
            type="range" 
            min="-180" max="180" step="1"
            disabled={state.aiAutoMode}
            value={localYaw}
            onChange={(e) => setLocalYaw(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 disabled:opacity-50"
          />
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
          <div>
            <div className="font-semibold text-slate-200">Emergency Braking</div>
            <div className="text-xs text-slate-500">Halt rotor immediately</div>
          </div>
          <button
            onClick={() => updateControl({ brakingSystem: !state.brakingSystem })}
            className={`px-6 py-2 rounded-lg font-bold text-sm tracking-wide transition-all ${
              state.brakingSystem 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {state.brakingSystem ? 'RELEASE BRAKE' : 'ENGAGE BRAKE'}
          </button>
        </div>
      </div>
    </div>
  );
}
