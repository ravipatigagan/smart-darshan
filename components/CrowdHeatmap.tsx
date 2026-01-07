
import React, { useEffect, useState } from 'react';
import { Map, Layers, Info } from 'lucide-react';
import { CrowdMetric } from '../types';

const ZONES = [
  { id: '1', name: 'South Raja Gopuram (Main)', x: 50, y: 90, radius: 15 }, 
  { id: '2', name: 'East Gopuram', x: 90, y: 50, radius: 15 }, 
  { id: '3', name: 'West Gopuram', x: 10, y: 50, radius: 15 }, 
  { id: '4', name: 'North Gopuram (Entry)', x: 50, y: 10, radius: 15 }, 
  { id: '5', name: 'Annadanam Hall', x: 75, y: 75, radius: 18 },
  { id: '6', name: 'Kesakandana Sala', x: 25, y: 25, radius: 18 },
];

export const CrowdHeatmap: React.FC = () => {
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    const generateData = () => {
      const newMetrics = ZONES.map(z => {
        const isPeak = new Date().getHours() >= 8 && new Date().getHours() <= 13;
        const baseDensity = isPeak ? 70 : 35;
        const density = Math.min(100, Math.max(10, baseDensity + (Math.random() * 30 - 15)));
        return {
          zoneId: z.id,
          zoneName: z.name,
          density: Math.round(density),
          status: density > 80 ? 'CRITICAL' : density > 60 ? 'MODERATE' : 'SAFE',
          flowRate: Math.floor(Math.random() * 40) + 10,
          trend: 'STABLE'
        } as CrowdMetric;
      });
      setMetrics(newMetrics);
    };
    generateData();
    const interval = setInterval(generateData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getZoneColor = (status: string, alpha: number) => {
    if (status === 'CRITICAL') return `rgba(239, 68, 68, ${alpha})`;
    if (status === 'MODERATE') return `rgba(249, 115, 22, ${alpha})`;
    return `rgba(34, 197, 94, ${alpha})`;
  };

  return (
    <div className="bg-white p-0 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[500px]">
      <div className="relative flex-1 bg-slate-100">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-2 rounded shadow-sm text-xs">
            <p className="font-bold border-b pb-1 mb-1">Dwarakatirumala Layout</p>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Safe</div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-full p-4">
           {/* Temple Outer Wall */}
           <rect x="15" y="15" width="70" height="70" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
           {/* Core Sanctum */}
           <rect x="40" y="40" width="20" height="20" fill="#94a3b8" rx="2" />
           <circle cx="50" cy="50" r="4" fill="#f59e0b" />

           {metrics.map((m, i) => {
             const z = ZONES[i];
             const active = selectedZone === m.zoneId;
             return (
               <g key={m.zoneId} onClick={() => setSelectedZone(m.zoneId)} className="cursor-pointer">
                 <circle cx={z.x} cy={z.y} r={z.radius} fill={getZoneColor(m.status, active ? 0.5 : 0.3)}>
                    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
                 </circle>
                 <circle cx={z.x} cy={z.y} r="2" fill="#1e293b" />
                 {active && (
                   <g>
                     <rect x={z.x-12} y={z.y-18} width="24" height="6" rx="1" fill="black" />
                     <text x={z.x} y={z.y-14} textAnchor="middle" fontSize="2.5" fill="white">{m.density}% Load</text>
                   </g>
                 )}
               </g>
             );
           })}
        </svg>
      </div>
      <div className="w-full md:w-64 border-l p-4 overflow-y-auto">
        <h4 className="font-bold text-sm mb-4">Gopuram & Zone Status</h4>
        <div className="space-y-2">
            {metrics.map(m => (
                <div key={m.id} className={`p-2 border rounded text-xs ${selectedZone === m.zoneId ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
                    <div className="flex justify-between font-bold">
                        <span>{m.zoneName}</span>
                        <span className={m.status === 'CRITICAL' ? 'text-red-600' : 'text-green-600'}>{m.density}%</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
