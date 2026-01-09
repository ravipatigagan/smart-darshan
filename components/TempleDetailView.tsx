
import React from 'react';
import { 
  ArrowLeft, Activity, ShieldCheck, MapPin, Users, 
  AlertTriangle, Clock, BarChart3, TrendingUp, Info,
  CheckCircle2, Siren, Radio, Zap
} from 'lucide-react';
import { TempleStatus } from '../types';

interface TempleDetailViewProps {
  temple: TempleStatus;
  onBack: () => void;
}

export const TempleDetailView: React.FC<TempleDetailViewProps> = ({ temple, onBack }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Detail Header */}
      <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-slate-100 p-3 rounded-2xl hover:bg-slate-200 transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{temple.name}</h2>
              {temple.isMock && (
                <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase">Simulated Node</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <MapPin size={10} className="text-orange-600" /> {temple.location} • Shrine Detail View
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${
             temple.status === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-600' : 
             temple.status === 'WARNING' ? 'bg-orange-50 border-orange-100 text-orange-600' :
             'bg-green-50 border-green-100 text-green-600'
           }`}>
             <div className={`w-2 h-2 rounded-full ${temple.status === 'CRITICAL' ? 'bg-red-500 animate-ping' : temple.status === 'WARNING' ? 'bg-orange-500' : 'bg-green-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest">{temple.status} LEVEL</span>
           </div>
           <button className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
             Refresh Feed
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Metrics Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Users size={80} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Crowd Intensity</p>
              <div className="flex items-end gap-2 mb-6">
                 <h3 className="text-5xl font-black">{Math.round(temple.density)}%</h3>
                 <p className="text-xs font-bold text-slate-500 uppercase pb-1.5">Capacity</p>
              </div>
              <div className="space-y-3">
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        temple.density > 80 ? 'bg-red-500' : temple.density > 50 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${temple.density}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                    <span>Low Load</span>
                    <span>Max Capacity</span>
                 </div>
              </div>
           </div>

           <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                 <Zap size={14} className="text-indigo-600" /> Operational Vitality
              </h4>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Active Alerts</span>
                    <span className="text-sm font-black text-slate-900">{temple.activeAlerts}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Incidents Logged</span>
                    <span className="text-sm font-black text-slate-900">{temple.incidentCount}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">MTTR</span>
                    <span className="text-sm font-black text-green-600">14.2m</span>
                 </div>
              </div>
           </div>

           <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                 <Radio size={16} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Protocol Status</span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium opacity-90">
                {temple.status === 'SAFE' 
                  ? "Standard operational protocols active. No anomalies detected." 
                  : `Automated re-routing and staff mobilization protocol ${temple.status === 'CRITICAL' ? 'LEVEL-4' : 'LEVEL-2'} initiated.`}
              </p>
           </div>
        </div>

        {/* Dynamic Detail Content */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg"><TrendingUp size={18} className="text-indigo-600" /></div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Historical Trend (Simulated)</h4>
                 </div>
                 <div className="flex gap-2">
                    <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">24H Window</span>
                 </div>
              </div>
              
              <div className="h-64 flex items-end gap-3 px-4">
                 {[30, 45, 60, 85, 90, 75, 50, 40, 35, 55, 70, 40].map((h, i) => (
                   <div key={i} className="flex-1 group relative">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         {h}% Load
                      </div>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 ${h > 80 ? 'bg-red-500' : h > 50 ? 'bg-orange-500' : 'bg-slate-200'}`}
                        style={{ height: `${h}%` }}
                      />
                   </div>
                 ))}
              </div>
              <div className="flex justify-between mt-4 text-[8px] font-black text-slate-400 uppercase tracking-widest border-t pt-4">
                 <span>04:00 AM</span>
                 <span>12:00 PM</span>
                 <span>08:00 PM</span>
                 <span>12:00 AM</span>
              </div>
           </div>

           <div className="bg-white border rounded-3xl p-8 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><Activity size={100} /></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                 <Info size={16} className="text-orange-600" /> PoC Simulation Data Disclaimer
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium relative z-10">
                This detail view aggregates multi-source telemetry including Video Analytics, Gate Counters, and GPS Heatmaps. For the <b>{temple.name}</b>, the indicators shown are currently operating in <b>Simulation Mode</b> to demonstrate state-wide monitoring capabilities.
              </p>
              <div className="flex flex-wrap gap-4 pt-4 relative z-10">
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Vision Sync: OK</span>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Gate Relay: OK</span>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border">
                    <Zap size={14} className="text-orange-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">AI Prediction: Active</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
