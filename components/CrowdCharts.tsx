
import React, { useState, useEffect } from 'react';
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

const INITIAL_HOURLY_DATA = [
  { time: '06:00', prediction: 1200, actual: 1100 },
  { time: '07:00', prediction: 1800, actual: 1750 },
  { time: '08:00', prediction: 2500, actual: 2600 },
  { time: '09:00', prediction: 3200, actual: 3400 },
  { time: '10:00', prediction: 4000, actual: 3800 },
  { time: '11:00', prediction: 4500, actual: 4200 },
  { time: '12:00', prediction: 4200, actual: 4100 },
  { time: '13:00', prediction: 3500, actual: null },
  { time: '14:00', prediction: 3000, actual: null },
  { time: '15:00', prediction: 3800, actual: null },
  { time: '16:00', prediction: 4800, actual: null },
  { time: '17:00', prediction: 5500, actual: null },
];

const INITIAL_GATE_DATA = [
  { name: 'East Gate', visitors: 4500, capacity: 5000 },
  { name: 'North Gate', visitors: 3200, capacity: 4000 },
  { name: 'South Gate', visitors: 1800, capacity: 3000 },
  { name: 'VIP Gate', visitors: 500, capacity: 1000 },
];

export const FootfallPredictionChart: React.FC = () => {
  const [data, setData] = useState(INITIAL_HOURLY_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHourStr = now.getHours().toString().padStart(2, '0') + ':00';
      
      setData(prev => prev.map(item => {
        // If hour is past or equal to current hour, ensure actual is not null
        const isPastOrCurrent = item.time <= currentHourStr;
        let newActual = item.actual;
        
        if (isPastOrCurrent && newActual === null) {
          newActual = item.prediction + (Math.random() * 200 - 100);
        } else if (isPastOrCurrent && newActual !== null) {
          // Slight fluctuation for "live" feel
          newActual = Math.max(0, newActual + (Math.random() * 20 - 10));
        }

        return { ...item, actual: newActual ? Math.round(newActual) : null };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Real-time vs Predicted Footfall</h3>
        <span className="text-[10px] font-mono bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">LIVE SYNC ACTIVE</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="prediction" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPred)" name="AI Prediction" />
            <Area type="monotone" dataKey="actual" stroke="#8884d8" fillOpacity={1} fill="url(#colorActual)" name="Actual Footfall" />
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
        const fluctuation = Math.random() * 50 - 25;
        const newVisitors = Math.min(gate.capacity, Math.max(0, gate.visitors + fluctuation));
        return { ...gate, visitors: Math.round(newVisitors) };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Gate Load Distribution</h3>
        <span className="text-[10px] font-mono bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">DYNAMIC LOAD SYNC</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Legend />
            <Bar dataKey="visitors" name="Current Visitors" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" name="Max Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
