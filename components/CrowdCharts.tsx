
import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Clock } from 'lucide-react';

/**
 * Unified Time Synchronizer
 * Generates a 12-hour sliding window data set based on the current system time.
 */
const generateDynamicHourlyData = () => {
  const now = new Date();
  const data = [];
  
  // Create a 12-hour window: 6 hours past, current hour, 5 hours future
  for (let i = -6; i <= 5; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours().toString().padStart(2, '0') + ':00';
    
    // Simulate prediction based on common temple rush hours (mornings and evenings)
    const baseHour = d.getHours();
    const prediction = Math.round(3000 + 1500 * Math.sin((baseHour - 6) * Math.PI / 12) + (Math.random() * 200));
    
    // Actual data only for past and current hours
    let actual: number | null = null;
    if (i < 0) {
      // Past hours: prediction + small historical variance
      actual = Math.round(prediction + (Math.random() * 400 - 200));
    } else if (i === 0) {
      // Current hour: real-time moving target
      actual = Math.round(prediction + (Math.random() * 100 - 50));
    }

    data.push({
      time: hour,
      prediction,
      actual,
      isCurrent: i === 0,
      timestamp: d.getTime()
    });
  }
  return data;
};

const INITIAL_GATE_DATA = [
  { name: 'East Gate', visitors: 4500, capacity: 5000 },
  { name: 'North Gate', visitors: 3200, capacity: 4000 },
  { name: 'South Gate', visitors: 1800, capacity: 3000 },
  { name: 'VIP Gate', visitors: 500, capacity: 1000 },
];

export const FootfallPredictionChart: React.FC = () => {
  const [data, setData] = useState(generateDynamicHourlyData());
  const [lastSyncHour, setLastSyncHour] = useState(new Date().getHours());

  useEffect(() => {
    // 1-second interval to ensure the chart is always in sync with system clock
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();

      // If we crossed an hour boundary, shift the entire data window
      if (currentHour !== lastSyncHour) {
        setData(generateDynamicHourlyData());
        setLastSyncHour(currentHour);
      } else {
        // Otherwise, update the "Actual" metric for the current slot to show live jitter
        setData(prev => prev.map(item => {
          if (item.isCurrent) {
            // High-fidelity jitter for live demo feel
            const jitter = Math.random() * 20 - 10;
            const updatedActual = Math.max(0, (item.actual || item.prediction) + jitter);
            return { ...item, actual: Math.round(updatedActual) };
          }
          return item;
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncHour]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Real-time vs Predicted Footfall</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Neural Temporal Sync: active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
              cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Area 
              type="monotone" 
              dataKey="prediction" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPred)" 
              name="AI Prediction" 
              isAnimationActive={false} // Disable initial animation to prevent jitter during rapid updates
            />
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#6366f1" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              name="Actual Footfall" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const GateLoadChart: React.FC = () => {
  const [data, setData] = useState(INITIAL_GATE_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(gate => {
        // High-frequency sensor jitter simulation
        const fluctuation = Math.random() * 60 - 30;
        const newVisitors = Math.min(gate.capacity, Math.max(100, gate.visitors + fluctuation));
        return { ...gate, visitors: Math.round(newVisitors) };
      }));
    }, 1500); // 1.5s refresh for bar load jitter
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 p-2.5 rounded-2xl text-orange-600">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Gate Load Distribution</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dynamic Load Sync: Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Activity size={14} className="text-orange-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sensors</span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
            />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Bar 
              dataKey="visitors" 
              name="Current Pilgrims" 
              fill="#f59e0b" 
              radius={[6, 6, 0, 0]} 
              barSize={40}
              isAnimationActive={true}
              animationDuration={500}
            />
            <Bar 
              dataKey="capacity" 
              name="Max Capacity" 
              fill="#e2e8f0" 
              radius={[6, 6, 0, 0]} 
              barSize={40}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
