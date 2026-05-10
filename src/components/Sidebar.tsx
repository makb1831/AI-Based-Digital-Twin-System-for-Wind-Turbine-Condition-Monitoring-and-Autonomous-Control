import { Activity, LayoutDashboard, FileText, Settings, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'reports') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-white/10 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 text-cyan-400">
          <Activity className="w-8 h-8" />
          <span className="font-bold text-xl tracking-wider uppercase">Aura</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'reports'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Reports</span>
        </button>
      </nav>

      <div className="p-4 m-4 rounded-xl bg-slate-950 border border-white/5">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Security</span>
        </div>
        <p className="text-xs text-slate-500">Zero-trust architecture enabled. End-to-end encryption active.</p>
      </div>

      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
          AD
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">Admin User</p>
          <p className="text-xs text-slate-500">System Operator</p>
        </div>
      </div>
    </aside>
  );
}
