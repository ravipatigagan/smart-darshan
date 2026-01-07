
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, MessageSquareText, Settings, Menu, ShieldCheck, Map, Calendar, CloudRain, Activity, Wifi, WifiOff
} from 'lucide-react';
import { AppView, CrowdMetric, Alert } from './types';
import { FootfallPredictionChart, GateLoadChart } from './components/CrowdCharts';
import { DevoteeAssistant } from './components/DevoteeAssistant';
import { VideoAnalytics } from './components/VideoAnalytics';
import { CrowdHeatmap } from './components/CrowdHeatmap';
import { OptimizationSuggestion } from './services/geminiService';
import { getQueueCount } from './services/offlineStore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  
  // Real-time states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 24, condition: 'Sunny', humidity: 72 });

  useEffect(() => {
    // Clock update every 1s
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Real-time Peak Detection (8:00 AM - 1:30 PM) logic
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isPeak = (hours > 8 || (hours === 8 && minutes >= 0)) && (hours < 13 || (hours === 13 && minutes <= 30));
      
      if (isPeak && !activeAlert) {
         setActiveAlert({
            id: 'peak-alert',
            type: 'info',
            message: "PEAK PERIOD ACTIVE (08:00-13:30): Deploying extra staff to Kesakandana Sala.",
            timestamp: now
         });
      } else if (!isPeak && activeAlert?.id === 'peak-alert') {
        setActiveAlert(null);
      }
    }, 1000);

    // Weather Sync - PDF range: 22-29°C, 60-90% humidity
    const updateWeather = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Simulate temperature curve: cooler at night/morning, warmer at noon
      let baseTemp = 24;
      if (hour >= 11 && hour <= 16) baseTemp = 27; // Midday heat
      else if (hour >= 20 || hour <= 5) baseTemp = 22; // Night cool
      
      const fluctuation = Math.random() * 2;
      const finalTemp = Math.round(baseTemp + fluctuation);
      
      setWeather({ 
        temp: Math.min(29, Math.max(22, finalTemp)), 
        condition: Math.random() > 0.7 ? 'Partly Cloudy' : 'Mostly Sunny',
        humidity: 60 + Math.floor(Math.random() * 30)
      });
    };

    updateWeather();
    const weatherTimer = setInterval(updateWeather, 30000); // Sync every 30s

    return () => { 
      clearInterval(clockTimer); 
      clearInterval(weatherTimer); 
    };
  }, [activeAlert]);

  const toggleRemoteMode = () => {
    const newMode = !isRemoteMode;
    setIsRemoteMode(newMode);
    setIsOnline(!newMode && navigator.onLine);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        currentView === view ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      {sidebarOpen && <span className="font-medium">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {!isOnline && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center gap-2 z-[60] font-mono border-b border-white/10 uppercase">
              <WifiOff size={14} className="text-orange-500" /> <span>Rural Edge Mode Active: Buffer Local (HikCentral) | Peer-to-Peer Sync Pending</span>
          </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 pt-8 shadow-2xl z-[50]`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
           <div className="bg-orange-600 p-2 rounded-lg shadow-inner"><ShieldCheck size={20} /></div>
           {sidebarOpen && <div><h1 className="font-bold text-sm tracking-tight">DivyaDrishti</h1><p className="text-[9px] opacity-60 font-mono">SVSD DEVSTHANAM</p></div>}
        </div>
        <div className="flex-1 p-4 space-y-2">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Control Center" />
          <NavItem view={AppView.ANALYTICS} icon={BarChart3} label="Predictive Insights" />
          <NavItem view={AppView.ASSISTANT} icon={MessageSquareText} label="DivyaSahayak" />
          <NavItem view={AppView.SETTINGS} icon={Settings} label="VMS Settings" />
        </div>
        <div className="p-4 border-t border-slate-800">
            <button onClick={toggleRemoteMode} className={`w-full p-2.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-colors ${isRemoteMode ? 'bg-red-900/40 text-red-100 border border-red-700/50' : 'bg-slate-800 text-slate-400 border border-transparent'}`}>
                {isRemoteMode ? <WifiOff size={14} className="text-red-400"/> : <Wifi size={14}/>} {sidebarOpen && (isRemoteMode ? 'ENABLE CLOUD SYNC' : 'GO OFFLINE (EDGE)')}
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!isOnline ? 'mt-8' : ''} transition-all duration-300`}>
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm z-40">
          <div className="flex items-center gap-4">
            <h2 className="font-black text-slate-800 uppercase tracking-tighter text-sm md:text-base">Dwarakatirumala Command Center</h2>
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-full border text-[11px] font-mono text-slate-600 shadow-inner">
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-orange-600"/> {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 font-black text-slate-900">{currentTime.toLocaleTimeString('en-IN', { hour12: true })}</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5"><CloudRain size={12} className="text-blue-500"/> {weather.temp}°C {weather.condition} <span className="opacity-50">(RH {weather.humidity}%)</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] text-right hidden sm:block">
                <p className="font-bold text-slate-900">CONSOLE: DWARAKA_NODE_04</p>
                <div className="flex items-center gap-1 justify-end text-green-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="font-bold">HIKCENTRAL LINK UP</p>
                </div>
             </div>
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border"><Menu size={20}/></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === AppView.DASHBOARD && (
            <>
                <div className="bg-indigo-950 p-7 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center border border-indigo-800 shadow-2xl overflow-hidden relative group">
                    <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:opacity-10 transition-opacity"><Map size={240} /></div>
                    <div className="z-10 text-center md:text-left">
                        <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mb-2">DivyaDrishti AI Prediction Node</p>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">System Status: <span className={activeAlert ? 'text-orange-400' : 'text-green-400'}>{activeAlert ? 'PEAK FLOW' : 'NOMINAL'}</span></h3>
                        <p className="text-sm opacity-70 font-medium">Monitoring South, East, West, North Gates & 11 Core Service Zones.</p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 z-10 text-center md:text-right shadow-xl">
                        <p className="text-[9px] uppercase font-bold text-indigo-300 mb-1">Geospatial Marker</p>
                        <p className="font-mono text-sm font-bold tracking-widest">16.9499°N 81.2991°E</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Feeds', val: '324', icon: Activity, color: 'text-slate-900' },
                        { label: 'Darshan Flow', val: activeAlert ? 'High' : 'Optimal', icon: Calendar, color: activeAlert ? 'text-orange-600' : 'text-green-600' },
                        { label: 'VMS Latency', val: '18ms', icon: Activity, color: 'text-blue-600' },
                        { label: 'Staff Duty', val: '84/90', icon: ShieldCheck, color: 'text-slate-900' }
                    ].map((s, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">{s.label}</p>
                                <s.icon size={14} className={s.color} />
                            </div>
                            <p className={`text-xl md:text-2xl font-black ${s.color}`}>{s.val}</p>
                        </div>
                    ))}
                </div>

                <VideoAnalytics isOffline={!isOnline} />
                <CrowdHeatmap />
            </>
          )}
          
          {currentView === AppView.ANALYTICS && <div className="space-y-6 animate-in fade-in duration-500"><FootfallPredictionChart /><GateLoadChart /></div>}
          {currentView === AppView.ASSISTANT && <div className="max-w-4xl mx-auto h-[700px] animate-in slide-in-from-bottom duration-500"><DevoteeAssistant isOffline={!isOnline} /></div>}
          {currentView === AppView.SETTINGS && (
              <div className="bg-white p-12 rounded-3xl border shadow-sm text-center max-w-xl mx-auto mt-12 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">VMS Administration</h3>
                  <p className="text-slate-500 mt-3 text-sm leading-relaxed">System Console for Sri Venkateswara Swamy Vari Devasthanam. Root access required for HikCentral partition modifications.</p>
                  <button className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Access Root Terminal</button>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
