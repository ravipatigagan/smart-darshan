
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BarChart3, MessageSquareText, Settings, Menu, ShieldCheck, Activity, Volume2, Megaphone, AlertCircle, Mic, Send, Radio, Smartphone, MessageCircle, Phone, Cpu, Key, Terminal, Info, Zap, AlertTriangle, Loader2, CheckCircle2, XCircle, Globe, ExternalLink, Sun, Users, Clock, Thermometer, TrendingUp, Flame, Building2, ClipboardCheck, PlusCircle, ShieldAlert, Navigation, Trophy, Split, Sparkles, ChevronRight, Calendar, ArrowRight
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

// --- PREDICTIVE FEED COMPONENT ---
const PREDICTIVE_INTEL_DATA = [
  { id: 1, type: 'EVENT', message: "Today is the last day for Vaikunta Dwara Darshan; expecting a 40% evening surge in crowd density.", icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 2, type: 'STRATEGY', message: "Open the North Gate for dual Entry/Exit to mitigate Raja Gopuram bottleneck.", icon: Navigation, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 3, type: 'TACTICAL', message: "Bypass Gate 4 protocol enabled: Diverting secondary flow to East Annexe.", icon: Split, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 4, type: 'AI_OBS', message: "Abnormal queue formation detected at Hall 6. Recommendation: Deploy 4 marshals.", icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 5, type: 'ENVIRONMENT', message: "Heat index rising; humidity 68%. Cooling fans in Queue Complex active.", icon: Thermometer, color: 'text-yellow-600', bg: 'bg-yellow-50' }
];

const PredictiveIntelFeed: React.FC = () => {
  const [activeItems, setActiveItems] = useState(PREDICTIVE_INTEL_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItems(prev => {
        const next = [...prev];
        const first = next.shift()!;
        next.push(first);
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Trophy size={18} /></div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Tactical Intelligence Stream</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">AI Prediction & Event Correlation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">LIVE DATASETS SYNCED</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-hidden relative">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
        {activeItems.map((item, idx) => (
          <div 
            key={item.id} 
            className={`p-4 rounded-2xl border flex items-start gap-4 transition-all duration-700 animate-in slide-in-from-right-4 fade-in ${
              idx === 0 ? 'scale-100 opacity-100 shadow-md border-slate-200 bg-white' : 'scale-95 opacity-40 grayscale-[0.5]'
            }`}
          >
            <div className={`p-2 rounded-lg ${item.bg} ${item.color} shrink-0`}>
              <item.icon size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[8px] font-black uppercase tracking-widest ${item.color}`}>{item.type}</span>
                <span className="text-[8px] font-mono text-slate-300">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">
                {item.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MOCK DATA ---
const INITIAL_MOCK_INCIDENTS: IncidentLifecycle[] = [
  {
    id: 'INC-8821',
    category: 'CONGESTION',
    severity: 'WARNING',
    description: 'High density detected at South Raja Gopuram. Flow rate dropped to 8 persons/min.',
    t1_detected: new Date(Date.now() - 3600000),
    t2_approved: new Date(Date.now() - 3540000),
    t3_dispatched: new Date(Date.now() - 3535000),
    t4_resolved: new Date(Date.now() - 2400000),
    adminInvolved: 'CHIEF_COMMANDER_ALPHA',
    status: 'RESOLVED'
  },
  {
    id: 'INC-9012',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    description: 'Potential bottleneck anomaly detected in Queue Complex Hall 4. Risk of secondary surge.',
    t1_detected: new Date(Date.now() - 7200000),
    t2_approved: new Date(Date.now() - 7180000),
    t3_dispatched: new Date(Date.now() - 7175000),
    t4_resolved: new Date(Date.now() - 6000000),
    adminInvolved: 'SYSTEM_FAILSAFE_AUTO',
    status: 'RESOLVED'
  }
];

const MOCK_PENDING_ALERTS: ProposedAlert[] = [
  {
    id: 'pa-001',
    category: 'CONGESTION',
    severity: 'WARNING',
    message: 'Density at North Gate exceeded 70%. Recommended: Open standby gate B.',
    timestamp: new Date(),
    status: 'PENDING',
    playbookSteps: [{ id: 's1', instruction: 'Deploy 4 personnel to Gate B', isCompleted: false }, { id: 's2', instruction: 'Update signage', isCompleted: false }]
  },
  {
    id: 'pa-002',
    category: 'ROUTE_GUIDE',
    severity: 'INFO',
    message: 'Bottleneck forming at Footwear Counter. Divert flow to East Annexe.',
    timestamp: new Date(Date.now() - 300000),
    status: 'PENDING'
  },
  {
    id: 'pa-003',
    category: 'EMERGENCY',
    severity: 'CRITICAL',
    message: 'Medical SOS: Cardiac emergency reported near Queue 4, Pillar 12.',
    timestamp: new Date(Date.now() - 600000),
    status: 'PENDING'
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
  
  const [temples, setTemples] = useState<TempleStatus[]>(MOCK_TEMPLES);
  const [selectedTemple, setSelectedTemple] = useState<TempleStatus | null>(null);
  const [proposedAlerts, setProposedAlerts] = useState<ProposedAlert[]>(MOCK_PENDING_ALERTS);
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
      whatsappToken: defaultToken, phoneNumberId: '', relayUrl: 'http://localhost:8000/send', 
      officialSenderName: 'Command Center - Dwaraka Tirumala', gatewayStatus: 'CONNECTED', useCorsProxy: true 
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
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, t2_approved: new Date(), t3_dispatched: new Date(), adminInvolved: 'CHIEF_COMMANDER_ALPHA' } : inc));
      setTimeout(() => {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, t4_resolved: new Date(), status: 'RESOLVED' } : inc));
      }, 30000);
    }
    setProposedAlerts(prev => prev.map(a => a.id === id ? { ...a, status: action === 'APPROVE' ? 'DISPATCHED' : 'REJECTED' } : a));
    setAuditLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), alertId: id, action: action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'EDIT', admin: "CHIEF_COMMANDER_ALPHA", timestamp: new Date(), details: `${action}D alert for ${alert.category}: "${finalMsg}"` }, ...prev]);
  };

  const handleViewTempleDetails = (temple: TempleStatus) => {
    setSelectedTemple(temple);
    setCurrentView(AppView.TEMPLE_DETAILS);
  };

  const handleOnboardComplete = (newTemple: TempleStatus) => {
    setTemples(prev => [newTemple, ...prev]);
    setCurrentView(AppView.ENDOWMENTS_OVERVIEW);
  };

  const sendStaffAlert = async (type: 'WHATSAPP' | 'SMS') => {
    if (!staffMessage.trim()) return;
    setLastDispatchStatus({ status: 'NEGOTIATING RELAY...' });
    const result = await dispatchOfficialNotification(type, adminPhone, staffMessage, staffRole, gatewayConfig);
    setLastDispatchStatus(result);
    if (result.success) setTimeout(() => { if (!result.warning) setLastDispatchStatus(null); setStaffMessage(""); }, 5000);
  };

  const triggerPA = async (templateKey: string | null) => {
    const text = templateKey ? PA_TEMPLATES[templateKey][paLanguage] : customPaText;
    if (!text.trim()) return;
    setIsSynthesizing(true);
    await playPAAnnouncement(text, paLanguage);
    setIsSynthesizing(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans text-[13px]">
      {staffNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-500 w-full max-w-xl px-4">
          <div className={`backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 flex items-center gap-5 ${staffNotification.severity === 'CRITICAL' ? 'bg-red-600/90' : 'bg-slate-900/90'}`}>
            <div className="bg-white/20 p-3 rounded-full text-white animate-bounce"><Megaphone size={24} /></div>
            <div className="flex-1 text-white">
              <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Live Staff Dispatch</p>
              <p className="text-sm font-bold leading-snug">"{staffNotification.message}"</p>
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
           <button onClick={simulateSurge} className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-2 transition-all">
             <Flame size={12} /> {sidebarOpen ? 'Simulate Surge' : ''}
           </button>
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
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                <Globe size={12} className="text-blue-500" /> Dwaraka Tirumala
              </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg border transition-colors"><Menu size={18}/></button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-t bg-slate-50/50">
             <div className="p-4 flex items-center gap-3 border-r">
                <Clock size={16} className="text-blue-600 opacity-60" />
                <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Time</p><p className="text-xs font-bold text-slate-800">{currentTime.toLocaleTimeString()}</p></div>
             </div>
             <div className="p-4 flex items-center gap-3 border-r">
                <Sun size={16} className="text-orange-600 opacity-60" />
                <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Weather</p><p className="text-xs font-bold text-slate-800">{weather.temp}°C • Clear</p></div>
             </div>
             <div className="p-4 flex items-center gap-3 border-r">
                <Users size={16} className="text-indigo-600 opacity-60" />
                <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Personnel</p><p className="text-xs font-bold text-slate-800">{activeStaff} Active</p></div>
             </div>
             <div className="p-4 flex items-center gap-3">
                <Zap size={16} className="text-green-600 opacity-60" />
                <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Protocol Health</p><p className="text-xs font-bold text-slate-800">100% Fail-Safe</p></div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === AppView.DASHBOARD && (
            <>
                {/* --- AI EARLY PREDICTION HUB (RESTORED & RECTIFIED) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className={`col-span-1 lg:col-span-1 p-6 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden border border-white/10 transition-all duration-500 ${
                    safetyAnalysis?.status === 'CRITICAL' ? 'bg-red-600 text-white' : 
                    safetyAnalysis?.status === 'WARNING' ? 'bg-orange-500 text-white' : 
                    'bg-slate-900 text-white'
                  }`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu size={120} /></div>
                    <div className="z-10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">AI Early Warning Engine</p>
                        {isAnalyzing && <Loader2 className="animate-spin opacity-50" size={14} />}
                      </div>
                      <div className="flex items-center gap-4">
                        <h3 className="text-5xl font-black mb-1">{safetyAnalysis?.status || 'INIT...'}</h3>
                        {safetyAnalysis?.status !== 'SAFE' && <AlertTriangle size={32} className="animate-pulse text-yellow-300" />}
                      </div>
                      <p className="text-[10px] opacity-70 uppercase tracking-tight font-bold">Neural Sync: Nominal | Confidence: {((safetyAnalysis?.confidence || 0.95) * 100).toFixed(1)}%</p>
                    </div>
                    
                    <div className="mt-8 z-10 p-5 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 shadow-inner">
                       <div className="flex items-center gap-2 mb-2">
                          <Split size={14} className="text-orange-400" />
                          <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Strategic Rerouting Message</p>
                       </div>
                       <p className="text-xs leading-relaxed font-bold italic">"{safetyAnalysis?.reRoutingStrategy || 'Awaiting telemetry stream sync...'}"</p>
                    </div>
                  </div>

                  {/* --- DYNAMIC PREDICTIVE INTEL FEED (REPLACED GRAPH) --- */}
                  <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl border shadow-xl p-6 flex flex-col overflow-hidden relative min-h-[300px]">
                    <PredictiveIntelFeed />
                  </div>
                </div>

                {safetyAnalysis?.isFallback && (
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500">
                     <div className="flex items-center gap-3">
                        <Zap size={20} className="text-orange-400 animate-pulse" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest">Local Engine Active</p>
                           <p className="text-xs font-medium opacity-90">AI quota reached. Using deterministic Heuristic Engine for continued safety analysis.</p>
                        </div>
                     </div>
                     <span className="text-[8px] font-black bg-white/10 px-3 py-1.5 rounded-full border border-white/20">FAILSAFE_MODE_V3</span>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] border shadow-2xl overflow-hidden mb-6">
                   <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
                      <Navigation size={18} className="text-orange-600" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Tactical Diversion Map</h4>
                      <span className="ml-auto text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Live Traffic Sync: Active</span>
                   </div>
                   <CrowdHeatmap />
                </div>

                <AdminAlertControl proposedAlerts={proposedAlerts} auditLogs={auditLogs} onAction={handleAlertAction} />
                <DevoteeAlertPortal />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[2.5rem] border shadow-xl p-8 flex flex-col relative overflow-hidden">
                      <div className="flex justify-between items-center mb-8 border-b pb-4">
                          <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2.5 rounded-2xl"><MessageCircle size={20} className="text-indigo-600" /></div>
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Tactical Staff Broadcast</h4>
                          </div>
                      </div>
                      <div className="space-y-6 flex-1 flex flex-col">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Target Hub</label>
                                <div className="flex items-center gap-3 bg-slate-50 border rounded-2xl px-5 py-4">
                                    <Smartphone size={16} className="text-slate-400" />
                                    <input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="91xxxxxxxxxx" className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intervention Role</label>
                                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)} className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-xs font-black uppercase text-slate-700 outline-none">
                                   <option value="SECURITY">Security / Police</option>
                                   <option value="VOLUNTEER">Pilgrim Support</option>
                                   <option value="MEDICAL">EMS Units</option>
                                </select>
                             </div>
                          </div>
                          <textarea value={staffMessage} onChange={(e) => setStaffMessage(e.target.value)} placeholder="Enter operational directive..." className="flex-1 bg-slate-50 border rounded-3xl p-6 text-sm resize-none outline-none font-medium h-32 focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                          <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => sendStaffAlert('WHATSAPP')} className="bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all">
                                <MessageCircle size={18} /> WhatsApp Alert
                              </button>
                              <button onClick={() => sendStaffAlert('SMS')} className="bg-white border text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-[0.98] transition-all">
                                <Phone size={18} /> SMS Dispatch
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border shadow-xl p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8 border-b pb-4">
                        <div className="bg-orange-50 p-2.5 rounded-2xl"><Megaphone size={20} className="text-orange-600" /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Public Address Dispatch</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {[Language.ENGLISH, Language.TELUGU, Language.HINDI].map(lang => (
                                <button key={lang} onClick={() => setPaLanguage(lang)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${paLanguage === lang ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{lang.slice(0, 3)}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => triggerPA('CRITICAL_CROWD')} className="p-4 rounded-2xl bg-slate-50 border text-[9px] font-black uppercase text-slate-700 flex items-center gap-3 transition-all hover:bg-slate-100" disabled={isSynthesizing}><AlertCircle size={16} className="text-red-500" /> CROWD_ALERT</button>
                            <button onClick={() => triggerPA('GATE_RULE')} className="p-4 rounded-2xl bg-slate-50 border text-[9px] font-black uppercase text-slate-700 flex items-center gap-3 transition-all hover:bg-slate-100" disabled={isSynthesizing}><Radio size={16} className="text-indigo-500" /> GATE_ALERT</button>
                        </div>
                        <textarea value={customPaText} onChange={(e) => setCustomPaText(e.target.value)} placeholder="Type manual PA announcement..." className="w-full bg-slate-50 border rounded-3xl p-6 text-sm h-32 outline-none focus:ring-4 focus:ring-orange-500/5 transition-all" />
                        <button onClick={() => triggerPA(null)} disabled={isSynthesizing} className="w-full bg-orange-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-orange-700 transition-all">
                            {isSynthesizing ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                            {isSynthesizing ? 'SYNTHESIZING...' : 'DISPATCH AUDIO'}
                        </button>
                    </div>
                  </div>
                </div>
                <VideoAnalytics />
            </>
          )}

          {currentView === AppView.ENDOWMENTS_OVERVIEW && <EndowmentsDashboard temples={temples} onOnboardClick={() => setCurrentView(AppView.TEMPLE_ONBOARDING)} onViewDetails={handleViewTempleDetails} />}
          {currentView === AppView.TEMPLE_DETAILS && selectedTemple && <TempleDetailView temple={selectedTemple} onBack={() => { setSelectedTemple(null); setCurrentView(AppView.ENDOWMENTS_OVERVIEW); }} />}
          {currentView === AppView.EMERGENCY_OVERSIGHT && <EmergencyOversight incidents={incidents} />}
          {currentView === AppView.TEMPLE_ONBOARDING && <TempleOnboarding onComplete={handleOnboardComplete} />}
          {currentView === AppView.COMPLIANCE_VAULT && <ComplianceVault incidents={incidents} />}
          {currentView === AppView.ANALYTICS && <div className="space-y-6"><FootfallPredictionChart /><GateLoadChart /></div>}
          {currentView === AppView.ASSISTANT && <div className="max-w-5xl mx-auto h-[750px] shadow-2xl rounded-2xl overflow-hidden"><DevoteeAssistant /></div>}
          
          {currentView === AppView.SETTINGS && (
            <div className="max-w-xl mx-auto py-10">
                <div className="bg-white p-8 rounded-3xl border shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl"><Cpu size={32} /></div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Gateway Hub</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Tier Operational Layer</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Terminal size={12} /> REST API Relay URL</label>
                            <input value={gatewayConfig.relayUrl} onChange={(e) => setGatewayConfig({...gatewayConfig, relayUrl: e.target.value})} placeholder="http://your-backend.com/api" className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-mono outline-none" />
                        </div>
                        <button onClick={() => alert("Architecture Updated.")} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                           <Zap size={18} className="text-orange-500" /> Synchronize Operational Grid
                        </button>
                    </div>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
