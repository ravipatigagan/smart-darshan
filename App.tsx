
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, MessageSquareText, Settings, Menu, ShieldCheck, Map, Activity, Volume2, Megaphone, AlertCircle, Mic, Send, Radio, UserCheck, HeartPulse, Smartphone, MessageCircle, Phone, Cpu, Key, Lock, Terminal, Info, Zap, TrendingUp, AlertTriangle, ArrowRightLeft, Loader2, CheckCircle2, XCircle, Globe, RefreshCcw, Wifi, WifiOff, ExternalLink, ShieldAlert, CheckCircle, ZapOff, Sun, CloudRain, Users, Clock, Thermometer, Database
} from 'lucide-react';
import { AppView, CrowdMetric, Language, StaffRole, StaffAlert, EnterpriseGatewayConfig } from './types';
import { FootfallPredictionChart, GateLoadChart } from './components/CrowdCharts';
import { DevoteeAssistant } from './components/DevoteeAssistant';
import { VideoAnalytics } from './components/VideoAnalytics';
import { CrowdHeatmap } from './components/CrowdHeatmap';
import { playPAAnnouncement, PA_TEMPLATES, analyzeCrowdSafety, EarlyWarningAnalysis } from './services/geminiService';
import { dispatchOfficialNotification } from './services/notificationService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [safetyAnalysis, setSafetyAnalysis] = useState<EarlyWarningAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [adminPhone, setAdminPhone] = useState("919876543210");
  const [staffRole, setStaffRole] = useState<StaffRole>('SECURITY');
  const [staffMessage, setStaffMessage] = useState("");
  const [paLanguage, setPaLanguage] = useState<Language>(Language.ENGLISH);
  const [customPaText, setCustomPaText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [lastDispatchStatus, setLastDispatchStatus] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Weather and Stats Mock (Real-time Simulation)
  const [weather] = useState({ temp: 31, condition: 'Clear', humidity: 62 });
  const [activeStaff] = useState(128);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [gatewayConfig, setGatewayConfig] = useState<EnterpriseGatewayConfig>(() => {
    const saved = localStorage.getItem('svsd_gateway_config');
    const defaultToken = 'EAAUXaANsECMBQb5MALt89E30PlLZBHyZC3Lw7tUs0b8hLrOjIXabvZC1wCVjTjtZAPyXF5yQ8IzguzUq5KbnRwjuGC6Fpucqe7Gdvdge0dBX1EnQUuVZBDN0yuUu5DAlrJYONDRyhFvnFAxzjzQuCmKlbSZAUWZBI0WQ55i6ucROQnlHC8HqGNt5uQa1p8VAmq5mAZDZD';
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.whatsappToken) parsed.whatsappToken = defaultToken;
      return parsed;
    }
    
    return { 
      whatsappToken: defaultToken, 
      phoneNumberId: '', 
      officialSenderName: 'Command Center - Dwaraka Tirumala', 
      gatewayStatus: 'CONNECTED',
      useCorsProxy: true 
    };
  });

  const [metrics, setMetrics] = useState<CrowdMetric[]>([
    { zoneId: '1', zoneName: 'South Gate', density: 45, status: 'SAFE', flowRate: 20, trend: 'STABLE' },
    { zoneId: '4', zoneName: 'North Gate', density: 30, status: 'SAFE', flowRate: 15, trend: 'STABLE' },
    { zoneId: '6', zoneName: 'Queue Complex', density: 65, status: 'MODERATE', flowRate: 25, trend: 'UP' }
  ]);

  useEffect(() => {
    const runAnalysis = async () => {
      if (!process.env.API_KEY) return;
      setIsAnalyzing(true);
      const analysis = await analyzeCrowdSafety(metrics);
      setSafetyAnalysis(analysis);
      setIsAnalyzing(false);
    };
    runAnalysis();
    const interval = setInterval(runAnalysis, 30000);
    return () => clearInterval(interval);
  }, [metrics]);

  const sendStaffAlert = async (type: 'WHATSAPP' | 'SMS') => {
    if (!staffMessage.trim()) return;
    setLastDispatchStatus({ status: 'NEGOTIATING HUB...' });
    
    const result = await dispatchOfficialNotification(type, adminPhone, staffMessage, staffRole, gatewayConfig);
    setLastDispatchStatus(result);
    
    if (result.success) {
      setTimeout(() => { 
        if (!result.warning) setLastDispatchStatus(null); 
        setStaffMessage(""); 
      }, 5000);
    }
  };

  const triggerPA = async (templateKey: string | null) => {
    const text = templateKey ? PA_TEMPLATES[templateKey][paLanguage] : customPaText;
    if (!text.trim()) return;
    setIsSynthesizing(true);
    await playPAAnnouncement(text, paLanguage);
    setIsSynthesizing(false);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = paLanguage === Language.TELUGU ? 'te-IN' : paLanguage === Language.HINDI ? 'hi-IN' : 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setCustomPaText(e.results[0][0].transcript);
    recognition.start();
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        currentView === view ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      {sidebarOpen && <span className="font-medium text-xs uppercase tracking-widest">{label}</span>}
    </button>
  );

  const isDemoMode = !gatewayConfig.phoneNumberId || gatewayConfig.phoneNumberId === '';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 pt-8 shadow-2xl z-50`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
           <div className="bg-orange-600 p-2 rounded-lg"><ShieldCheck size={20} /></div>
           {sidebarOpen && <div><h1 className="font-black text-xs tracking-tight">DivyaDrishti</h1><p className="text-[8px] opacity-40 uppercase">AI Command Hub</p></div>}
        </div>
        <div className="flex-1 p-4 space-y-2">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Control Center" />
          <NavItem view={AppView.ANALYTICS} icon={BarChart3} label="Analytics" />
          <NavItem view={AppView.ASSISTANT} icon={MessageSquareText} label="Devotee Aid" />
          <NavItem view={AppView.SETTINGS} icon={Settings} label="Gateway Config" />
        </div>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-blue-500' : 'bg-green-500 animate-pulse'}`} />
              <span className="text-[9px] font-black uppercase text-slate-400">{isDemoMode ? 'Virtual Hub' : 'Live Gateway'}</span>
           </div>
           {sidebarOpen && <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Command Center - Dwaraka Tirumala</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* GLOBAL FIXED HEADER STRIP */}
        <header className="bg-white border-b shadow-sm z-40 flex flex-col">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">SVSD Operational Grid</h2>
              <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                <Globe size={12} className="text-blue-500" /> Dwaraka Tirumala, AP
              </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg border transition-colors"><Menu size={20}/></button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-t bg-slate-50/50 backdrop-blur-sm">
             <div className="p-4 flex items-center gap-4 border-r">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Clock size={18}/></div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Local System Time</p>
                   <p className="text-xs font-black text-slate-800">{currentTime.toLocaleTimeString('en-IN', { hour12: true })}</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-4 border-r">
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Thermometer size={18}/></div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temple Environment</p>
                   <p className="text-xs font-black text-slate-800">{weather.temp}°C • {weather.condition}</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-4 border-r">
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Users size={18}/></div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Personnel On-Duty</p>
                   <p className="text-xs font-black text-slate-800">{activeStaff} Staff Active</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-xl text-green-600"><Zap size={18}/></div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Grid Network Status</p>
                   <p className="text-xs font-black text-slate-800">99.8% Nominal</p>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === AppView.DASHBOARD && (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={`col-span-1 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                    safetyAnalysis?.status === 'CRITICAL' ? 'bg-red-600 text-white' : 
                    safetyAnalysis?.status === 'WARNING' ? 'bg-orange-500 text-white' : 
                    'bg-slate-900 text-white'
                  }`}>
                    <div className="z-10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">AI Early Warning System</p>
                        {isAnalyzing && <Loader2 className="animate-spin opacity-50" size={12} />}
                      </div>
                      <h3 className="text-4xl font-black mb-1">{safetyAnalysis?.status || 'INIT...'}</h3>
                      <p className="text-[10px] font-bold uppercase opacity-80">Anomaly Prediction Engine Active</p>
                    </div>
                    <div className="mt-8 z-10 p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                       <p className="text-[9px] font-black uppercase mb-1">AI Recommendation:</p>
                       <p className="text-[11px] leading-relaxed italic">{safetyAnalysis?.reRoutingStrategy || 'Monitoring flows.'}</p>
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest">Predictive Anomaly Log</h4>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {safetyAnalysis?.anomalies.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border text-xs text-slate-700 font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Resilient Official Bot Dispatch */}
                  <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b pb-3">
                          <div className="flex items-center gap-2">
                              <MessageCircle size={20} className="text-indigo-600" />
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Official Staff Alert Terminal</h4>
                          </div>
                          {lastDispatchStatus && (
                            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 rounded ${lastDispatchStatus.success === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {lastDispatchStatus.success === false ? <XCircle size={10}/> : <CheckCircle2 size={10}/>}
                              {lastDispatchStatus.status || lastDispatchStatus.mode || 'SENT'}
                            </div>
                          )}
                      </div>
                      <div className="space-y-4 flex-1 flex flex-col">
                          {lastDispatchStatus?.warning && (
                             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                                <div className="flex gap-3">
                                   <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                   <div className="space-y-1">
                                      <p className="text-[10px] text-amber-900 font-black uppercase">Virtual Dispatch Triggered</p>
                                      <p className="text-[9px] text-amber-800 font-bold leading-relaxed">{lastDispatchStatus.warning}</p>
                                   </div>
                                </div>
                                <button 
                                    onClick={() => window.open(lastDispatchStatus.directLink, '_blank')}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md"
                                >
                                    <ExternalLink size={14} /> Send Real Message Now (Direct Override)
                                </button>
                             </div>
                          )}
                          {lastDispatchStatus?.error && (
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-3">
                                    <Globe size={18} className="text-indigo-600 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-indigo-900 font-black uppercase tracking-tight">CORS Security Intervention</p>
                                        <p className="text-[9px] text-indigo-800 leading-relaxed font-bold">The browser blocked the background fetch. Please use the Direct Protocol link below.</p>
                                    </div>
                                </div>
                                {lastDispatchStatus.directLink && (
                                    <button 
                                        onClick={() => window.open(lastDispatchStatus.directLink, '_blank')}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg active:scale-[0.98]"
                                    >
                                        <ExternalLink size={14} /> Execute Manual Staff Notification
                                    </button>
                                )}
                            </div>
                          )}
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient Contact</label>
                              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                  <Smartphone size={16} className="text-slate-400" />
                                  <input 
                                      value={adminPhone} 
                                      onChange={(e) => setAdminPhone(e.target.value)}
                                      placeholder="91xxxxxxxxxx"
                                      className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full"
                                  />
                              </div>
                          </div>
                          <div className="flex gap-2">
                              {['SECURITY', 'VOLUNTEER', 'MEDICAL', 'ADMIN'].map(role => (
                                <button key={role} onClick={() => setStaffRole(role as StaffRole)} className={`flex-1 py-2 rounded-xl text-[9px] font-black border transition-all ${staffRole === role ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{role}</button>
                              ))}
                          </div>
                          <textarea 
                              value={staffMessage}
                              onChange={(e) => setStaffMessage(e.target.value)}
                              placeholder="Describe the situation for personnel..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs resize-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => sendStaffAlert('WHATSAPP')} className="bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                                <MessageCircle size={16} /> {isDemoMode ? 'VIRTUAL DISPATCH' : 'LIVE API DISPATCH'}
                              </button>
                              <button onClick={() => sendStaffAlert('SMS')} className="bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black shadow-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-[0.98]">
                                <Phone size={16} /> SMS FAILOVER
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* PA Console Panel */}
                  <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 border-b pb-3">
                        <Megaphone size={20} className="text-orange-600" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">AI Intelligent PA Broadcast</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {[Language.ENGLISH, Language.TELUGU, Language.HINDI].map(lang => (
                                <button key={lang} onClick={() => setPaLanguage(lang)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paLanguage === lang ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>{lang.toUpperCase()}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => triggerPA('CRITICAL_CROWD')} className="p-3 rounded-2xl bg-slate-50 border text-[9px] font-black text-slate-700 flex items-center gap-2" disabled={isSynthesizing}><AlertCircle size={14} className="text-red-500" /> CROWD DENSITY</button>
                            <button onClick={() => triggerPA('GATE_RULE')} className="p-3 rounded-2xl bg-slate-50 border text-[9px] font-black text-slate-700 flex items-center gap-2" disabled={isSynthesizing}><Radio size={14} className="text-orange-400" /> GATE RULES</button>
                        </div>
                        <div className="relative">
                            <textarea value={customPaText} onChange={(e) => setCustomPaText(e.target.value)} placeholder="Enter alert text for translation and broadcast..." className="w-full bg-slate-50 border rounded-2xl p-4 pr-12 text-xs h-24 outline-none focus:ring-2 focus:ring-orange-500/20" />
                            <button onClick={startListening} className={`absolute right-3 bottom-3 p-2 rounded-full border shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400'}`}><Mic size={18} /></button>
                        </div>
                        <button onClick={() => triggerPA(null)} disabled={isSynthesizing} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                            {isSynthesizing ? <Loader2 className="animate-spin" size={18} /> : <Volume2 size={18} />}
                            {isSynthesizing ? 'Generating PA Stream...' : 'Trigger Sequential PA'}
                        </button>
                    </div>
                  </div>
                </div>

                <VideoAnalytics />
                <CrowdHeatmap />
            </>
          )}

          {currentView === AppView.SETTINGS && (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-3xl border shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Cpu size={24} /></div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Enterprise Gateway</h3>
                          <p className="text-[10px] text-slate-500 font-medium tracking-tight">Manage <b>Dwaraka Tirumala</b> Hub</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                             <h4 className="text-[10px] font-black text-green-900 uppercase flex items-center gap-2 mb-2"><CheckCircle size={12}/> Secure Channel Monitoring</h4>
                             <p className="text-[9px] text-green-700 leading-relaxed font-bold">The platform automatically falls back to 'Direct Protocol' if your local network blocks background API calls.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Key size={12} /> Meta Cloud Access Token</label>
                            <input 
                              type="password" 
                              value={gatewayConfig.whatsappToken} 
                              onChange={(e) => setGatewayConfig({...gatewayConfig, whatsappToken: e.target.value})} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Terminal size={12} /> WhatsApp Phone Number ID</label>
                            <input 
                              value={gatewayConfig.phoneNumberId} 
                              onChange={(e) => setGatewayConfig({...gatewayConfig, phoneNumberId: e.target.value})} 
                              placeholder="Empty = Virtual Mode" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono" 
                            />
                        </div>
                        <button onClick={() => {
                          localStorage.setItem('svsd_gateway_config', JSON.stringify(gatewayConfig));
                          alert("Configuration Synchronized.");
                        }} className="w-full bg-indigo-950 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                           <ShieldCheck size={16} /> Sync Command Identity
                        </button>
                    </div>
                </div>
            </div>
          )}
          
          {currentView === AppView.ANALYTICS && <div className="space-y-6"><FootfallPredictionChart /><GateLoadChart /></div>}
          {currentView === AppView.ASSISTANT && <div className="max-w-4xl mx-auto h-[750px]"><DevoteeAssistant /></div>}
        </main>
      </div>
    </div>
  );
};

export default App;
