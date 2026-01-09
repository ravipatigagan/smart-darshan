
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, MessageSquareText, Settings, Menu, ShieldCheck, Activity, Volume2, Megaphone, AlertCircle, Mic, Send, Radio, Smartphone, MessageCircle, Phone, Cpu, Key, Terminal, Info, Zap, AlertTriangle, Loader2, CheckCircle2, XCircle, Globe, ExternalLink, Sun, Users, Clock, Thermometer, TrendingUp, Flame, Building2, ClipboardCheck, PlusCircle, ShieldAlert
} from 'lucide-react';
import { AppView, CrowdMetric, Language, StaffRole, EnterpriseGatewayConfig, ProposedAlert, AlertAuditEntry, IncidentLifecycle, TempleStatus } from './types';
import { FootfallPredictionChart, GateLoadChart } from './components/CrowdCharts';
import { DevoteeAssistant } from './components/DevoteeAssistant';
import { VideoAnalytics } from './components/VideoAnalytics';
import { CrowdHeatmap } from './components/CrowdHeatmap';
import { DevoteeAlertPortal } from './components/DevoteeAlertPortal';
import { AdminAlertControl } from './components/AdminAlertControl';
import { EndowmentsDashboard, MOCK_TEMPLES } from './components/EndowmentsDashboard';
import { ComplianceVault } from './components/ComplianceVault';
import { TempleOnboarding } from './components/TempleOnboarding';
import { EmergencyOversight } from './components/EmergencyOversight';
import { TempleDetailView } from './components/TempleDetailView';
import { playPAAnnouncement, PA_TEMPLATES, analyzeCrowdSafety, EarlyWarningAnalysis } from './services/geminiService';
import { dispatchOfficialNotification } from './services/notificationService';

const NavItem = (props: { view: AppView; icon: any; label: string; currentView: AppView; sidebarOpen: boolean; onClick: (view: AppView) => void }) => {
  const { view, icon: Icon, label, currentView, sidebarOpen, onClick } = props;
  return (
    <button onClick={() => onClick(view)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === view ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} />
      {sidebarOpen && <span className="font-semibold text-xs tracking-wide">{label}</span>}
    </button>
  );
};

// --- MOCK INCIDENT DATA FOR POC ---
const INITIAL_MOCK_INCIDENTS: IncidentLifecycle[] = [
  {
    id: 'INC-8821',
    category: 'CONGESTION',
    severity: 'WARNING',
    description: 'High density detected at South Raja Gopuram. Flow rate dropped to 8 persons/min.',
    t1_detected: new Date(Date.now() - 3600000), // 1 hour ago
    t2_approved: new Date(Date.now() - 3540000), // +1 min
    t3_dispatched: new Date(Date.now() - 3535000), // +5 sec
    t4_resolved: new Date(Date.now() - 2400000), // 40 mins ago
    adminInvolved: 'CHIEF_COMMANDER_ALPHA',
    status: 'RESOLVED'
  },
  {
    id: 'INC-9012',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    description: 'Potential bottleneck anomaly detected in Queue Complex Hall 4. Risk of secondary surge.',
    t1_detected: new Date(Date.now() - 7200000), // 2 hours ago
    t2_approved: new Date(Date.now() - 7180000), // +20 sec
    t3_dispatched: new Date(Date.now() - 7175000), // +5 sec
    t4_resolved: new Date(Date.now() - 6000000), // 1.6 hours ago
    adminInvolved: 'SYSTEM_FAILSAFE_AUTO',
    status: 'RESOLVED'
  }
];

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
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [lastDispatchStatus, setLastDispatchStatus] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // SHARED STATE FOR TEMPLES
  const [temples, setTemples] = useState<TempleStatus[]>(MOCK_TEMPLES);
  const [selectedTemple, setSelectedTemple] = useState<TempleStatus | null>(null);

  const [proposedAlerts, setProposedAlerts] = useState<ProposedAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AlertAuditEntry[]>([]);
  const [incidents, setIncidents] = useState<IncidentLifecycle[]>(INITIAL_MOCK_INCIDENTS);
  const [staffNotification, setStaffNotification] = useState<{message: string; severity: string} | null>(null);

  const [weather] = useState({ temp: 31, condition: 'Clear', humidity: 62 });
  const [activeStaff] = useState(128);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [gatewayConfig, setGatewayConfig] = useState<EnterpriseGatewayConfig>(() => {
    const saved = localStorage.getItem('svsd_gateway_config');
    const defaultToken = 'EAAUXaANsECMBQb5MALt89E30PlLZBHyZC3Lw7tUs0b8hLrOjIXabvZC1wCVjTjtZAPyXF5yQ8IzguzUq5KbnRwjuGC6Fpucqe7Gdvdge0dBX1EnQUuVZBDN0yuUu5DAlrJYONDRyhFvnFAxzjzQuCmKlbSZAUWZBI0WQ55i6ucROQnlHC8HqGNt5uQa1p8VAmq5mAZDZD';
    if (saved) return JSON.parse(saved);
    return { 
      whatsappToken: defaultToken, 
      phoneNumberId: '', 
      relayUrl: 'http://localhost:8000/send', 
      officialSenderName: 'Command Center - Dwaraka Tirumala', 
      gatewayStatus: 'CONNECTED',
      useCorsProxy: true 
    };
  });

  const [metrics] = useState<CrowdMetric[]>([
    { zoneId: '1', zoneName: 'South Gate', density: 45, status: 'SAFE', flowRate: 20, trend: 'STABLE' },
    { zoneId: '4', zoneName: 'North Gate', density: 30, status: 'SAFE', flowRate: 15, trend: 'STABLE' },
    { zoneId: '6', zoneName: 'Queue Complex', density: 65, status: 'MODERATE', flowRate: 25, trend: 'UP' }
  ]);

  const runAnalysis = async (customMetrics?: CrowdMetric[]) => {
    setIsAnalyzing(true);
    const analysis = await analyzeCrowdSafety(customMetrics || metrics);
    setSafetyAnalysis(analysis);
    
    if (analysis.proposedAlert) {
      setProposedAlerts(prev => {
        if (prev.some(a => a.message === analysis.proposedAlert?.message && a.status === 'PENDING')) return prev;
        return [analysis.proposedAlert!, ...prev];
      });

      const newIncident: IncidentLifecycle = {
        id: analysis.proposedAlert.id,
        category: analysis.proposedAlert.category,
        severity: analysis.proposedAlert.severity,
        description: analysis.proposedAlert.message,
        t1_detected: new Date(),
        adminInvolved: analysis.isFallback ? 'HEURISTIC_ENGINE' : 'AI_AGENT_DIVYA',
        status: 'ACTIVE',
        isSOS: analysis.proposedAlert.severity === 'CRITICAL' && Math.random() > 0.7
      };
      setIncidents(prev => [newIncident, ...prev]);
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    runAnalysis();
    const interval = setInterval(() => runAnalysis(), 45000);
    return () => clearInterval(interval);
  }, [metrics]);

  const simulateSurge = () => {
    const surgeMetrics: CrowdMetric[] = [
      { zoneId: '1', zoneName: 'South Gate', density: 92, status: 'CRITICAL', flowRate: 5, trend: 'UP' },
      { zoneId: '6', zoneName: 'Queue Complex', density: 88, status: 'CRITICAL', flowRate: 8, trend: 'UP' }
    ];
    runAnalysis(surgeMetrics);
  };

  const handleAlertAction = (id: string, action: 'APPROVE' | 'REJECT' | 'EDIT', msg?: string) => {
    const alert = proposedAlerts.find(a => a.id === id);
    if (!alert) return;

    const finalMsg = msg || alert.message;

    if (action === 'APPROVE') {
      setStaffNotification({ message: finalMsg, severity: alert.severity });
      setTimeout(() => setStaffNotification(null), 8000);

      setIncidents(prev => prev.map(inc => inc.id === id ? { 
        ...inc, 
        t2_approved: new Date(), 
        t3_dispatched: new Date(),
        adminInvolved: 'CHIEF_COMMANDER_ALPHA' 
      } : inc));

      setTimeout(() => {
        setIncidents(prev => prev.map(inc => inc.id === id ? { 
          ...inc, 
          t4_resolved: new Date(),
          status: 'RESOLVED'
        } : inc));
      }, 30000);
    }

    setProposedAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: action === 'APPROVE' ? 'DISPATCHED' : 'REJECTED' } : a
    ));

    const newAudit: AlertAuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      alertId: id,
      action: action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'EDIT',
      admin: "CHIEF_COMMANDER_ALPHA",
      timestamp: new Date(),
      details: `${action}D alert for ${alert.category}: "${finalMsg}"`
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const sendStaffAlert = async (type: 'WHATSAPP' | 'SMS') => {
    if (!staffMessage.trim()) return;
    setLastDispatchStatus({ status: 'NEGOTIATING RELAY...' });
    const result = await dispatchOfficialNotification(type, adminPhone, staffMessage, staffRole, gatewayConfig);
    setLastDispatchStatus(result);
    if (result.success) {
      setTimeout(() => { if (!result.warning) setLastDispatchStatus(null); setStaffMessage(""); }, 5000);
    }
  };

  const triggerPA = async (templateKey: string | null) => {
    const text = templateKey ? PA_TEMPLATES[templateKey][paLanguage] : customPaText;
    if (!text.trim()) return;
    setIsSynthesizing(true);
    await playPAAnnouncement(text, paLanguage);
    setIsSynthesizing(false);
  };

  const handleViewTempleDetails = (temple: TempleStatus) => {
    setSelectedTemple(temple);
    setCurrentView(AppView.TEMPLE_DETAILS);
  };

  const handleOnboardComplete = (newTemple: TempleStatus) => {
    setTemples(prev => [newTemple, ...prev]);
    setCurrentView(AppView.ENDOWMENTS_OVERVIEW);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans text-[13px]">
      {staffNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-500 w-full max-w-xl px-4">
          <div className={`backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 flex items-center gap-5 ${
            staffNotification.severity === 'CRITICAL' ? 'bg-red-600/90' : 'bg-slate-900/90'
          }`}>
            <div className="bg-white/20 p-3 rounded-full text-white animate-bounce"><Megaphone size={24} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Live Staff Instruction Dispatch</p>
              <p className="text-sm font-bold text-white leading-snug">"{staffNotification.message}"</p>
              <div className="flex gap-3 mt-3">
                 <span className="text-[8px] font-black bg-white/10 text-white/90 px-2 py-1 rounded uppercase border border-white/10">Push: Delivered</span>
                 <span className="text-[8px] font-black bg-white/10 text-white/90 px-2 py-1 rounded uppercase border border-white/10">WhatsApp: Simulating...</span>
              </div>
            </div>
            <button onClick={() => setStaffNotification(null)} className="text-white/40 hover:text-white"><XCircle size={20}/></button>
          </div>
        </div>
      )}

      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 pt-8 shadow-xl z-50`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-800 mb-4">
           <div className="bg-orange-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={20} /></div>
           {sidebarOpen && <div><h1 className="font-bold text-sm tracking-tight">DIVYADRISHTI</h1><p className="text-[8px] opacity-40 uppercase tracking-widest">Command Hub</p></div>}
        </div>
        <div className="flex-1 p-4 space-y-1">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Control Center" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.ENDOWMENTS_OVERVIEW} icon={Building2} label="Endowments Hub" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.EMERGENCY_OVERSIGHT} icon={ShieldAlert} label="Crisis Oversight" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.TEMPLE_ONBOARDING} icon={PlusCircle} label="Onboard Shrine" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.COMPLIANCE_VAULT} icon={ClipboardCheck} label="Compliance Vault" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.ANALYTICS} icon={BarChart3} label="Analytics" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.ASSISTANT} icon={MessageSquareText} label="Devotee Aid" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
          <NavItem view={AppView.SETTINGS} icon={Settings} label="Configuration" currentView={currentView} sidebarOpen={sidebarOpen} onClick={setCurrentView} />
        </div>
        <div className="p-4 border-t border-slate-800 space-y-3">
           <button 
             onClick={simulateSurge}
             className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-2 transition-all"
           >
             <Flame size={12} /> {sidebarOpen ? 'Simulate Surge' : ''}
           </button>
           <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {sidebarOpen && <span className="text-[9px] font-bold uppercase text-slate-500">Grid Online</span>}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b shadow-sm z-40 flex flex-col shrink-0">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 border">
                <Activity size={14} className="text-orange-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Operational Grid</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                <Globe size={12} className="text-blue-500" /> Dwaraka Tirumala
              </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg border transition-colors"><Menu size={18}/></button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-t bg-slate-50/50">
             <div className="p-4 flex items-center gap-3 border-r">
                <div className="text-blue-600 opacity-60"><Clock size={16}/></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Time</p>
                   <p className="text-xs font-bold text-slate-800">{currentTime.toLocaleTimeString('en-IN', { hour12: true })}</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-3 border-r">
                <div className="text-orange-600 opacity-60"><Sun size={16}/></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weather (DT)</p>
                   <p className="text-xs font-bold text-slate-800">{weather.temp}°C • {weather.condition}</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-3 border-r">
                <div className="text-indigo-600 opacity-60"><Users size={16}/></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Personnel</p>
                   <p className="text-xs font-bold text-slate-800">{activeStaff} Active</p>
                </div>
             </div>
             <div className="p-4 flex items-center gap-3">
                <div className="text-green-600 opacity-60"><Zap size={16}/></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Protocol Health</p>
                   <p className="text-xs font-bold text-slate-800">100% (Fail-Safe)</p>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === AppView.DASHBOARD && (
            <>
                {safetyAnalysis?.isFallback && (
                  <div className="bg-indigo-600 text-white p-4 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-500">
                     <div className="flex items-center gap-3">
                        <Zap size={20} className="text-orange-400 animate-pulse" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest">Local Engine Active</p>
                           <p className="text-xs font-medium opacity-90">AI quota reached. Using deterministic Heuristic Engine for continued safety analysis.</p>
                        </div>
                     </div>
                     <span className="text-[8px] font-black bg-white/10 px-2 py-1 rounded border border-white/20">FAILSAFE_MODE</span>
                  </div>
                )}

                <AdminAlertControl 
                  proposedAlerts={proposedAlerts} 
                  auditLogs={auditLogs}
                  onAction={handleAlertAction}
                />
                <DevoteeAlertPortal />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={`col-span-1 p-6 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                    safetyAnalysis?.status === 'CRITICAL' ? 'bg-red-600 text-white' : 
                    safetyAnalysis?.status === 'WARNING' ? 'bg-orange-500 text-white' : 
                    'bg-slate-900 text-white'
                  }`}>
                    <div className="z-10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">AI Early Warning Hub</p>
                        {isAnalyzing && <Loader2 className="animate-spin opacity-50" size={14} />}
                      </div>
                      <h3 className="text-4xl font-bold mb-1">{safetyAnalysis?.status || 'INIT...'}</h3>
                      <p className="text-[10px] opacity-70 uppercase tracking-tight">Cloud Anomaly Grid Active</p>
                    </div>
                    <div className="mt-8 z-10 p-4 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                       <p className="text-[8px] font-bold uppercase opacity-60 mb-1">AI Recommendation:</p>
                       <p className="text-xs leading-relaxed font-medium">{safetyAnalysis?.reRoutingStrategy || 'Monitoring active streams.'}</p>
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={18} className="text-indigo-600" />
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-800">Predictive Load Intensity</h4>
                        </div>
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Next Peak: 17:30 IST</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-end gap-2 h-32 px-2">
                           {[40, 60, 80, 70, 45, 30, 55, 90, 85, 40, 30, 20].map((h, i) => (
                             <div key={i} className="flex-1 group relative">
                                <div 
                                    className={`w-full rounded-t-md transition-all duration-700 ${h > 75 ? 'bg-red-500' : h > 50 ? 'bg-orange-500' : 'bg-slate-200'}`} 
                                    style={{ height: `${h}%` }}
                                ></div>
                             </div>
                           ))}
                        </div>
                        <div className="flex justify-between px-2 pt-2 mt-2 border-t text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {['06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h'].map(t => <span key={t}>{t}</span>)}
                        </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col relative">
                      <div className="flex justify-between items-center mb-6 border-b pb-4">
                          <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2 rounded-lg"><MessageCircle size={20} className="text-indigo-600" /></div>
                              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-800">Manual Staff Tactical Dispatch</h4>
                          </div>
                          {lastDispatchStatus && (
                            <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase px-3 py-1 rounded-full ${lastDispatchStatus.success === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {lastDispatchStatus.success === false ? <XCircle size={10}/> : <CheckCircle2 size={10}/>}
                              {lastDispatchStatus.status || 'PROTOCOL_BUSY'}
                            </div>
                          )}
                      </div>

                      <div className="space-y-4 flex-1 flex flex-col">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnel Hub</label>
                                <div className="flex items-center gap-3 bg-slate-50 border rounded-lg px-4 py-3">
                                    <Smartphone size={16} className="text-slate-400" />
                                    <input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="91xxxxxxxxxx" className="bg-transparent text-sm font-semibold text-slate-800 outline-none w-full" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Role</label>
                                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)} className="w-full bg-slate-50 border rounded-lg px-4 py-3 text-xs font-bold text-slate-700 outline-none">
                                   <option value="SECURITY">Security Post</option>
                                   <option value="VOLUNTEER">Pilgrim Support</option>
                                   <option value="MEDICAL">Medical Unit</option>
                                   <option value="ADMIN">Command Staff</option>
                                </select>
                             </div>
                          </div>
                          <textarea value={staffMessage} onChange={(e) => setStaffMessage(e.target.value)} placeholder="Alert message details..." className="flex-1 bg-slate-50 border rounded-xl p-4 text-sm resize-none outline-none placeholder:text-slate-300 font-medium h-24" />
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => sendStaffAlert('WHATSAPP')} className="bg-slate-900 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98]">
                                <MessageCircle size={16} /> WHATSAPP_SIM
                              </button>
                              <button onClick={() => sendStaffAlert('SMS')} className="bg-white border text-slate-900 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                                <Phone size={16} /> SMS_LEGACY
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <div className="bg-orange-50 p-2 rounded-lg"><Megaphone size={20} className="text-orange-600" /></div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-800">PA Broadcast Dispatch</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {[Language.ENGLISH, Language.TELUGU, Language.HINDI].map(lang => (
                                <button key={lang} onClick={() => setPaLanguage(lang)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all uppercase tracking-widest ${paLanguage === lang ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{lang.slice(0, 3)}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => triggerPA('CRITICAL_CROWD')} className="p-3 rounded-lg bg-slate-50 border text-[9px] font-bold text-slate-700 flex items-center gap-2" disabled={isSynthesizing}><AlertCircle size={14} className="text-red-500" /> CROWD_ALERT</button>
                            <button onClick={() => triggerPA('GATE_RULE')} className="p-3 rounded-lg bg-slate-50 border text-[9px] font-bold text-slate-700 flex items-center gap-2" disabled={isSynthesizing}><Radio size={14} className="text-indigo-500" /> GATE_ALERT</button>
                        </div>
                        <textarea value={customPaText} onChange={(e) => setCustomPaText(e.target.value)} placeholder="Type localized alert..." className="w-full bg-slate-50 border rounded-xl p-4 text-sm h-32 outline-none shadow-inner" />
                        <button onClick={() => triggerPA(null)} disabled={isSynthesizing} className="w-full bg-orange-600 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                            {isSynthesizing ? <Loader2 className="animate-spin" size={18} /> : <Volume2 size={18} />}
                            {isSynthesizing ? 'PREPARING...' : 'DISPATCH AUDIO'}
                        </button>
                    </div>
                  </div>
                </div>
                <VideoAnalytics />
                <CrowdHeatmap />
            </>
          )}

          {currentView === AppView.ENDOWMENTS_OVERVIEW && (
            <EndowmentsDashboard 
              temples={temples}
              onOnboardClick={() => setCurrentView(AppView.TEMPLE_ONBOARDING)} 
              onViewDetails={handleViewTempleDetails}
            />
          )}

          {currentView === AppView.TEMPLE_DETAILS && selectedTemple && (
            <TempleDetailView 
              temple={selectedTemple} 
              onBack={() => {
                setSelectedTemple(null);
                setCurrentView(AppView.ENDOWMENTS_OVERVIEW);
              }}
            />
          )}
          
          {currentView === AppView.EMERGENCY_OVERSIGHT && <EmergencyOversight incidents={incidents} />}

          {currentView === AppView.TEMPLE_ONBOARDING && <TempleOnboarding onComplete={handleOnboardComplete} />}

          {currentView === AppView.COMPLIANCE_VAULT && <ComplianceVault incidents={incidents} />}

          {currentView === AppView.SETTINGS && (
            <div className="max-w-xl mx-auto py-10">
                <div className="bg-white p-8 rounded-xl border shadow-lg">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-indigo-600 p-3 rounded-lg text-white shadow-md"><Cpu size={24} /></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Gateway Hub</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Multi-Tier Integration Layer</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Terminal size={12} /> REST API Relay URL</label>
                            <input value={gatewayConfig.relayUrl} onChange={(e) => setGatewayConfig({...gatewayConfig, relayUrl: e.target.value})} placeholder="http://your-backend.com/api" className="w-full bg-slate-50 border rounded-lg px-4 py-3.5 text-sm outline-none font-mono" />
                        </div>
                        <button onClick={() => {
                          localStorage.setItem('svsd_gateway_config', JSON.stringify(gatewayConfig));
                          alert("Architecture Updated.");
                        }} className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                           <Zap size={16} className="text-orange-500" /> Synchronize Operational Grid
                        </button>
                    </div>
                </div>
            </div>
          )}
          {currentView === AppView.ANALYTICS && <div className="space-y-6"><FootfallPredictionChart /><GateLoadChart /></div>}
          {currentView === AppView.ASSISTANT && <div className="max-w-5xl mx-auto h-[750px] shadow-2xl rounded-2xl overflow-hidden"><DevoteeAssistant /></div>}
        </main>
      </div>
    </div>
  );
};

export default App;
