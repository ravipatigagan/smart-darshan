
import React, { useEffect, useState } from 'react';
import { Map, Activity } from 'lucide-react';
import { CrowdMetric } from '../types';

const ZONES = [
  { id: '1', name: 'South Raja Gopuram', x: 50, y: 90, radius: 8 }, 
  { id: '2', name: 'East Gopuram', x: 90, y: 50, radius: 8 }, 
  { id: '3', name: 'West Gopuram', x: 10, y: 50, radius: 8 }, 
  { id: '4', name: 'North Gopuram', x: 50, y: 10, radius: 8 }, 
  { id: '5', name: 'Annadanam Hall', x: 75, y: 75, radius: 10 },
  { id: '6', name: 'Queue Complex', x: 25, y: 25, radius: 10 },
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
    <div className="bg-white overflow-hidden flex flex-col w-full h-full">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-orange-600" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Digital Twin - Live Heatmap</h4>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden p-6 md:p-10">
        {/* 
            SVG CONTAINMENT FIX:
            1. Expanded viewBox from 0,0,100,100 to -15,-10,130,120 to provide buffer for edge markers and labels.
            2. Added preserveAspectRatio to ensure the heatmap is always centered and contained without clipping.
            3. Applied max-h-full and max-w-full to prevent any container overflow.
        */}
        <svg 
          viewBox="-15 -10 130 120" 
          className="w-full h-full max-h-full max-w-full drop-shadow-2xl transition-all duration-300"
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: 'none' }}
        >
           {/* Temple Floor Plan */}
           <rect x="0" y="0" width="100" height="100" fill="white" stroke="#e2e8f0" strokeWidth="0.5" rx="4" />
           <rect x="42" y="42" width="16" height="16" fill="#fef3c7" stroke="#d97706" strokeWidth="0.4" rx="1" />
           <text x="50" y="52" textAnchor="middle" fontSize="2.5" fontWeight="900" fill="#92400e" className="uppercase tracking-widest">Sanctum</text>

           {/* Metrics Overlays */}
           {metrics.map((m, i) => {
             const z = ZONES[i];
             if (!z) return null;
             const color = getStatusColor(m.status);
             
             return (
               <g key={m.zoneId} className="transition-all duration-1000">
                 {/* Radial Heat pulse */}
                 <circle cx={z.x} cy={z.y} r={z.radius} fill={color} fillOpacity="0.2">
                    <animate attributeName="r" values={`${z.radius};${z.radius+2};${z.radius}`} dur="3s" repeatCount="indefinite" />
                 </circle>
                 
                 {/* Label Container */}
                 <rect x={z.x - 12} y={z.y - 4.5} width="24" height="9" rx="2" fill="white" fillOpacity="0.95" stroke={color} strokeWidth="0.5" className="shadow-sm" />
                 
                 {/* Zone Text */}
                 <text x={z.x} y={z.y - 1.5} textAnchor="middle" fontSize="1.8" fontWeight="900" fill="#1e293b" className="uppercase tracking-tighter">
                    {z.name.length > 15 ? z.name.slice(0, 12) + '...' : z.name}
                 </text>
                 
                 {/* Live Stats Text */}
                 <text x={z.x} y={z.y + 2.5} textAnchor="middle" fontSize="2.2" fontWeight="900" fill={color} className="uppercase">
                    {m.density}% • {m.status}
                 </text>
               </g>
             );
           })}
        </svg>

        {/* Dynamic Legend Overlays */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl border shadow-md z-10 scale-75 md:scale-90 origin-bottom-left">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">Critical Risk</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">Moderate Load</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">Safe Flow</span></div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-3 border-t flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase shrink-0">
        <Activity size={12} className="text-orange-600" />
        AI Integrated Visualization: Real-time telemetry feed
      </div>
    </div>
  );
};
