import { useEffect, useState } from 'react';
import { TelemetryState } from '../types';

interface ControlPanelProps {
  state: TelemetryState;
}

function ControlRow({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  unit: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm text-slate-300 mb-2">
        <span>{label}</span>
        <span className="font-mono text-cyan-300">
          {value.toFixed(step < 1 ? 2 : 1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="w-full accent-cyan-500 disabled:opacity-40"
      />
    </div>
  );
}

export default function ControlPanel({ state }: ControlPanelProps) {
  const [localPitch, setLocalPitch] = useState(state.bladePitch);
  const [localYaw, setLocalYaw] = useState(state.yaw);
  const [localWindSpeed, setLocalWindSpeed] = useState(state.windSpeed);
  const [localWindDirection, setLocalWindDirection] = useState(state.windDirection);
  const [localAirDensity, setLocalAirDensity] = useState(state.airDensity);
  const [localAmbientTemperature, setLocalAmbientTemperature] = useState(state.ambientTemperature);
  const [localTurbulence, setLocalTurbulence] = useState(state.turbulence);
  const [localBrake, setLocalBrake] = useState(state.brakingSystem);
  const [localAutoMode, setLocalAutoMode] = useState(state.aiAutoMode);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty) {
      return;
    }

    setLocalPitch(state.bladePitch);
    setLocalYaw(state.yaw);
    setLocalWindSpeed(state.windSpeed);
    setLocalWindDirection(state.windDirection);
    setLocalAirDensity(state.airDensity);
    setLocalAmbientTemperature(state.ambientTemperature);
    setLocalTurbulence(state.turbulence);
    setLocalBrake(state.brakingSystem);
    setLocalAutoMode(state.aiAutoMode);
  }, [state, isDirty]);

  const updateControl = async (updates: Partial<TelemetryState>) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update controls', error);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const updates: Partial<TelemetryState> = {};

      if (Math.abs(localPitch - state.bladePitch) > 0.5) updates.bladePitch = localPitch;
      if (Math.abs(localYaw - state.yaw) > 0.5) updates.yaw = localYaw;
      if (Math.abs(localWindSpeed - state.windSpeed) > 0.5) updates.windSpeed = localWindSpeed;
      if (Math.abs(localWindDirection - state.windDirection) > 0.5) updates.windDirection = localWindDirection;
      if (Math.abs(localAirDensity - state.airDensity) > 0.002) updates.airDensity = localAirDensity;
      if (Math.abs(localAmbientTemperature - state.ambientTemperature) > 0.5) updates.ambientTemperature = localAmbientTemperature;
      if (Math.abs(localTurbulence - state.turbulence) > 0.01) updates.turbulence = localTurbulence;
      if (localBrake !== state.brakingSystem) updates.brakingSystem = localBrake;
      if (localAutoMode !== state.aiAutoMode) updates.aiAutoMode = localAutoMode;

      if (Object.keys(updates).length > 0) {
        void updateControl(updates);
      }

      setIsDirty(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    localPitch,
    localYaw,
    localWindSpeed,
    localWindDirection,
    localAirDensity,
    localAmbientTemperature,
    localTurbulence,
    localBrake,
    localAutoMode,
    state,
  ]);

  return (
    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-xl shadow-xl flex flex-col gap-6 flex-1">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            System Controls
          </h2>
          <p className="text-xs text-slate-500 mt-1">Environmental inputs drive the simulation; turbine inputs drive the control loop.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-mono text-slate-300">
          {state.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Power</div>
          <div className="text-xl font-bold text-cyan-300 font-mono">{state.powerGenerated.toFixed(2)} MW</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Yaw Error</div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {Math.abs(((state.windDirection - state.yaw + 540) % 360) - 180).toFixed(1)}°
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Environment</div>
          <ControlRow label="Wind Speed" value={localWindSpeed} min={0} max={35} step={0.1} unit=" m/s" onChange={(value) => { setIsDirty(true); setLocalWindSpeed(value); }} />
          <ControlRow label="Wind Direction" value={localWindDirection} min={0} max={360} step={1} unit="°" onChange={(value) => { setIsDirty(true); setLocalWindDirection(value); }} />
          <ControlRow label="Air Density" value={localAirDensity} min={1.0} max={1.32} step={0.001} unit=" kg/m³" onChange={(value) => { setIsDirty(true); setLocalAirDensity(value); }} />
          <ControlRow label="Ambient Temperature" value={localAmbientTemperature} min={-10} max={45} step={0.5} unit=" °C" onChange={(value) => { setIsDirty(true); setLocalAmbientTemperature(value); }} />
          <ControlRow label="Turbulence" value={localTurbulence} min={0.02} max={0.45} step={0.01} unit="" onChange={(value) => { setIsDirty(true); setLocalTurbulence(value); }} />
        </div>

        <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Turbine</div>
          <ControlRow label="Blade Pitch" value={localPitch} min={0} max={90} step={1} unit="°" disabled={localAutoMode} onChange={(value) => { setIsDirty(true); setLocalPitch(value); }} />
          <ControlRow label="Yaw" value={localYaw} min={0} max={360} step={1} unit="°" disabled={localAutoMode} onChange={(value) => { setIsDirty(true); setLocalYaw(value); }} />
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-200">AI Auto Mode</div>
            <div className="text-xs text-slate-500">Automatic pitch, yaw, and brake control</div>
          </div>
          <button
            onClick={() => { setIsDirty(true); setLocalAutoMode(!localAutoMode); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              localAutoMode ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAutoMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 p-4">
          <div>
            <div className="font-semibold text-slate-200">Emergency Braking</div>
            <div className="text-xs text-slate-500">Manual safety override for testing</div>
          </div>
          <button
            onClick={() => { setIsDirty(true); setLocalBrake(!localBrake); }}
            className={`px-5 py-2 rounded-lg font-bold text-sm tracking-wide transition-all ${
              localBrake
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {localBrake ? 'RELEASE BRAKE' : 'ENGAGE BRAKE'}
          </button>
        </div>
      </div>
    </div>
  );
}