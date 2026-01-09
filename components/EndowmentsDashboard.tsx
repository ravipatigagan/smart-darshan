
import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Users, AlertTriangle, CheckCircle2, 
  TrendingUp, Clock, Info, Globe, ShieldCheck, Activity, BarChart, Plus
} from 'lucide-react';
import { TempleStatus } from '../types';

const MOCK_TEMPLES: TempleStatus[] = [
  {
    id: 'dt-01',
    name: 'Dwaraka Tirumala (Chinna Tirupati)',
    location: 'Eluru District',
    density: 45,
    status: 'SAFE',
    activeAlerts: 0,
    incidentCount: 2,
    lastUpdate: new Date(),
    isMock: false
  },
  {
    id: 'ttd-01',
    name: 'Tirumala Tirupati Devasthanams',
    location: 'Tirupati',
    density: 88,
    status: 'CRITICAL',
    activeAlerts: 5,
    incidentCount: 14,
    lastUpdate: new Date(),
    isMock: true
  },
  {
    id: 'ss-01',
    name: 'Srisailam Bhramaramba Mallikarjuna',
    location: 'Nandyal',
    density: 62,
    status: 'WARNING',
    activeAlerts: 1,
    incidentCount: 4,
    lastUpdate: new Date(),
    isMock: true
  },
  {
    id: 'kd-01',
    name: 'Kanaka Durga Temple',
    location: 'Vijayawada',
    density: 35,
    status: 'SAFE',
    activeAlerts: 0,
    incidentCount: 1,
    lastUpdate: new Date(),
    isMock: true
  },
  {
    id: 'sv-01',
    name: 'Simhachalam Varaha Lakshmi Narasimha',
    location: 'Visakhapatnam',
    density: 28,
    status: 'SAFE',
    activeAlerts: 0,
    incidentCount: 0,
    lastUpdate: new Date(),
    isMock: true
  }
];

interface EndowmentsDashboardProps {
  onOnboardClick?: () => void;
}

export const EndowmentsDashboard: React.FC<EndowmentsDashboardProps> = ({ onOnboardClick }) => {
  const [temples, setTemples] = useState<TempleStatus[]>(MOCK_TEMPLES);

  // Simulate live fluctuations for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setTemples(prev => prev.map(t => ({
        ...t,
        density: Math.max(10, Math.min(100, t.density + (Math.random() * 4 - 2))),
        lastUpdate: new Date()
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPilgrims = temples.reduce((acc, t) => acc + (t.density * 100), 0);
  const criticalCount = temples.filter(t => t.status === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* State Overview Header */}
      <div className="flex justify-between items-center bg-white border rounded-3xl p-6 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl"><Globe size={24} /></div>
            <div>
               <h2 className="text-xl font-black text-slate-900 tracking-tight">Endowments State Command Center</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Shrine Grid Monitoring</p>
            </div>
         </div>
         <button 
           onClick={onOnboardClick}
           className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 flex items-center gap-2 transition-all active:scale-95"
         >
           <Plus size={16} /> Onboard New Shrine
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-32 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
          <div className="relative z-10">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Aggregate State Load</p>
             <h3 className="text-3xl font-black">{Math.round(totalPilgrims).toLocaleString()}</h3>
             <p className="text-[9px] font-bold text-slate-500 uppercase">Estimated Pilgrims</p>
          </div>
        </div>
        <div className="bg-white border rounded-3xl p-6 shadow-sm flex items-center gap-5 h-32">
           <div className="bg-red-50 p-4 rounded-2xl text-red-600"><AlertTriangle size={28} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active State Alerts</p>
              <h3 className="text-2xl font-black text-slate-900">{criticalCount} <span className="text-xs font-bold text-slate-400">SHRINES</span></h3>
           </div>
        </div>
        <div className="bg-white border rounded-3xl p-6 shadow-sm flex items-center gap-5 h-32">
           <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><ShieldCheck size={28} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Health</p>
              <h3 className="text-2xl font-black text-slate-900">98.4%</h3>
           </div>
        </div>
      </div>

      {/* Temple Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {temples.map(t => (
          <div key={t.id} className="bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
            <div className="p-6 border-b flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900">{t.name}</h4>
                  {t.isMock && <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">MOCK_FEED</span>}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  <MapPin size={10} /> {t.location}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                t.status === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                t.status === 'WARNING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                'bg-green-50 text-green-600 border-green-100'
              }`}>
                {t.status}
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crowd Density</p>
                     <p className="text-xs font-black text-slate-900">{Math.round(t.density)}%</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-1000 ${
                         t.density > 80 ? 'bg-red-500' : t.density > 50 ? 'bg-orange-500' : 'bg-green-500'
                       }`}
                       style={{ width: `${t.density}%` }}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Alerts</p>
                     <div className="flex items-center gap-2">
                        <BarChart size={14} className="text-indigo-600" />
                        <span className="text-sm font-black text-slate-800">{t.activeAlerts}</span>
                     </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Incidents</p>
                     <div className="flex items-center gap-2">
                        <Activity size={14} className="text-orange-600" />
                        <span className="text-sm font-black text-slate-800">{t.incidentCount}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Synced: {t.lastUpdate.toLocaleTimeString()}</span>
               </div>
               <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                  View Detail <TrendingUp size={12} />
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
         <div className="bg-white/10 p-5 rounded-3xl border border-white/10 relative z-10"><Info size={32} /></div>
         <div className="flex-1 space-y-2 relative z-10 text-center md:text-left">
            <h5 className="text-lg font-bold tracking-tight">Endowments Department Read-Only Protocol</h5>
            <p className="text-sm text-indigo-200 leading-relaxed opacity-80">
              This dashboard provides state-level visibility for strategic resource allocation. Use the <b>"Onboard New Shrine"</b> feature to integrate additional temples into the DivyaDrishti AI monitoring grid.
            </p>
         </div>
         <div className="flex gap-4 shrink-0 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
               <div className="w-2 h-2 rounded-full bg-green-500" />
               <span className="text-[9px] font-black uppercase tracking-widest">Normal</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest">Action Needed</span>
            </div>
         </div>
      </div>
    </div>
  );
};
