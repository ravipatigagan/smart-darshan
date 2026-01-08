
import React, { useEffect, useState } from 'react';
import { Map, Info, Activity } from 'lucide-react';
import { CrowdMetric } from '../types';

const ZONES = [
  { id: '1', name: 'South Raja Gopuram', x: 50, y: 92, radius: 10 }, 
  { id: '2', name: 'East Gopuram', x: 92, y: 50, radius: 10 }, 
  { id: '3', name: 'West Gopuram', x: 8, y: 50, radius: 10 }, 
  { id: '4', name: 'North Gopuram', x: 50, y: 8, radius: 10 }, 
  { id: '5', name: 'Annadanam Hall', x: 75, y: 75, radius: 12 },
  { id: '6', name: 'Queue Complex', x: 25, y: 25, radius: 12 },
];

export const CrowdHeatmap: React.FC = () => {
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);

  useEffect(() => {
    const update = () => {
      setMetrics(ZONES.map(z => ({
        zoneId: z.id,
        zoneName: z.name,
        density: Math.floor(Math.random() * 80) + 10,
        status: Math.random() > 0.8 ? 'CRITICAL' : Math.random() > 0.5 ? 'MODERATE' : 'SAFE',
        flowRate: 15,
        trend: 'STABLE'
      })));
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'CRITICAL') return '#ef4444';
    if (status === 'MODERATE') return '#f97316';
    return '#22c55e';
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-orange-600" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Digital Twin - Live Heatmap</h4>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-50 p-8">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
           {/* Temple Floor Plan */}
           <rect x="10" y="10" width="80" height="80" fill="white" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
           <rect x="42" y="42" width="16" height="16" fill="#fef3c7" stroke="#d97706" strokeWidth="0.4" rx="1" />
           <text x="50" y="52" textAnchor="middle" fontSize="2" fontWeight="900" fill="#92400e" className="uppercase tracking-widest">Sanctum</text>

           {/* Metrics Overlays */}
           {metrics.map((m, i) => {
             const z = ZONES[i];
             const color = getStatusColor(m.status);
             
             return (
               <g key={m.zoneId} className="transition-all duration-1000">
                 {/* Radial Heat pulse */}
                 <circle cx={z.x} cy={z.y} r={z.radius} fill={color} fillOpacity="0.2">
                    <animate attributeName="r" values={`${z.radius};${z.radius+1};${z.radius}`} dur="3s" repeatCount="indefinite" />
                 </circle>
                 
                 {/* Label Container */}
                 <rect x={z.x - 12} y={z.y - 4} width="24" height="8" rx="1" fill="white" stroke={color} strokeWidth="0.3" className="shadow" />
                 
                 {/* Zone Text */}
                 <text x={z.x} y={z.y - 1} textAnchor="middle" fontSize="1.4" fontWeight="900" fill="#1e293b" className="uppercase tracking-tighter">
                    {z.name.length > 15 ? z.name.slice(0, 12) + '...' : z.name}
                 </text>
                 
                 {/* Live Stats Text */}
                 <text x={z.x} y={z.y + 2.5} textAnchor="middle" fontSize="1.8" fontWeight="900" fill={color} className="uppercase">
                    {m.density}% • {m.status}
                 </text>
               </g>
             );
           })}
        </svg>

        <div className="absolute bottom-6 left-6 flex gap-4 bg-white/80 backdrop-blur p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> <span className="text-[10px] font-black uppercase text-slate-600">Critical Risk</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> <span className="text-[10px] font-black uppercase text-slate-600">Moderate Load</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> <span className="text-[10px] font-black uppercase text-slate-600">Safe Flow</span></div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 border-t flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
        <Activity size={14} className="text-orange-600" />
        AI Integrated Visualization: Metrics updated every 5 seconds
      </div>
    </div>
  );
};
