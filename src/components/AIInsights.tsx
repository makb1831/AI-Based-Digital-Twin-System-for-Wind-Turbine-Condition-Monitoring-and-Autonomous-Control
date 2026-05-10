import { useState, useEffect } from 'react';
import { TelemetryState } from '../types';
import { BrainCircuit, RefreshCw } from 'lucide-react';

interface AIInsightsProps {
  state: TelemetryState;
}

interface AIReport {
  analysis: string;
  recommendation: string;
  healthScore: number;
}

export default function AIInsights({ state }: AIInsightsProps) {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAIReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict');
      const data = await res.json();
      if (!data.error) {
        setReport(data);
      } else {
        setReport({ analysis: data.error, recommendation: 'Check API Key configuration.', healthScore: 0 });
      }
    } catch (e) {
      console.error(e);
      setReport({ analysis: "Connection to AI service failed.", recommendation: "Check network connection.", healthScore: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch occasionally or on first load
  useEffect(() => {
    fetchAIReport();
    const interval = setInterval(fetchAIReport, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-500/20 p-6 rounded-xl shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          Gemini AI Predictor
        </h2>
        <button 
          onClick={fetchAIReport}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!report && loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-4 bg-white/5 rounded w-3/4"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex-shrink-0 relative w-16 h-16 rounded-full flex items-center justify-center border-2 border-indigo-500/30 bg-indigo-500/10">
              <span className="text-xl font-bold text-indigo-300 font-mono">{report.healthScore}</span>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-900" />
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${report.healthScore * 1.88} 200`} className="text-indigo-400" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">System Health Score</p>
              <p className="text-xs text-slate-500 mt-1">Based on real-time neural analysis</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-indigo-400 mb-2">Analysis</h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
              {report.analysis}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-indigo-400 mb-2">Recommendation</h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
              {report.recommendation}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
