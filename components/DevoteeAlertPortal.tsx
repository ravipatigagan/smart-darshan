
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Bell, Smartphone, Send, Megaphone, Volume2, Globe, AlertTriangle, 
  Route, Clock, X, Info, ClipboardList, CheckCircle2, Terminal, User, Loader2,
  PhoneCall, MessageSquare, ListTree
} from 'lucide-react';
import { Language, AdvisoryCategory, AdvisoryLog } from '../types';
import { playPAAnnouncement } from '../services/geminiService';

interface TemplateDefinition {
  text: Record<Language, string>;
  fields: string[];
}

const TEMPLATE_DEFS: Record<AdvisoryCategory, TemplateDefinition> = {
  CONGESTION: {
    fields: ['zone', 'wait_time', 'alternate_route'],
    text: {
      [Language.ENGLISH]: "High crowd detected near {{zone}}. Expected wait: {{wait_time}}. Proceed via {{alternate_route}}.",
      [Language.TELUGU]: "{{zone}} దగ్గర విపరీతమైన రద్దీ ఉంది. వేచి ఉండే సమయం: {{wait_time}}. దయచేసి {{alternate_route}} ద్వారా వెళ్ళండి.",
      [Language.HINDI]: "{{zone}} के पास भारी भीड़ है। प्रतीक्षा समय: {{wait_time}}। कृपया {{alternate_route}} के माध्यम से आगे बढ़ें।"
    }
  },
  DARSHAN_PAUSE: {
    fields: ['zone', 'duration', 'reason', 'resume_time'],
    text: {
      [Language.ENGLISH]: "Darshan paused at {{zone}} for {{duration}} due to {{reason}}. Resumes at {{resume_time}}.",
      [Language.TELUGU]: "{{reason}} వల్ల {{zone}} వద్ద దర్శనం {{duration}} నిలిపివేయబడింది. తిరిగి {{resume_time}} గంటలకు ప్రారంభమవుతుంది.",
      [Language.HINDI]: "{{reason}} के कारण {{zone}} पर दर्शन {{duration}} के लिए रुका है। {{resume_time}} बजे फिर से शुरू होगा।"
    }
  },
  ROUTE_GUIDE: {
    fields: ['congested_zone', 'clear_zone', 'activity'],
    text: {
      [Language.ENGLISH]: "Congestion at {{congested_zone}}. Use {{clear_zone}} for faster {{activity}}.",
      [Language.TELUGU]: "{{congested_zone}} వద్ద రద్దీగా ఉంది. త్వరగా {{activity}} కోసం {{clear_zone}} ఉపయోగించండి.",
      [Language.HINDI]: "{{congested_zone}} पर भीड़ है। तेजी से {{activity}} के लिए {{clear_zone}} का उपयोग करें।"
    }
  },
  EMERGENCY: {
    fields: ['severity', 'location', 'action'],
    text: {
      [Language.ENGLISH]: "{{severity}} alert at {{location}}. Please {{action}} immediately.",
      [Language.TELUGU]: "{{location}} వద్ద {{severity}} హెచ్చరిక. దయచేసి వెంటనే {{action}}.",
      [Language.HINDI]: "{{location}} पर {{severity}} चेतावनी। कृपया तुरंत {{action}} करें।"
    }
  }
};

export const DevoteeAlertPortal: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AdvisoryCategory>('CONGESTION');
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    zone: 'Main Hall',
    wait_time: '45 mins',
    alternate_route: 'South Exit Gate',
    duration: '20 mins',
    reason: 'cleaning',
    resume_time: '11:00 AM',
    congested_zone: 'Queue 4',
    clear_zone: 'VIP Lane',
    activity: 'exit',
    severity: 'High',
    location: 'Gate 2',
    action: 'evacuate'
  });
  
  const [logs, setLogs] = useState<AdvisoryLog[]>([]);
  const [activeAdvisory, setActiveAdvisory] = useState<string | null>(null);
  const [activeSms, setActiveSms] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSmsSending, setIsSmsSending] = useState(false);
  const [isIvrActive, setIsIvrActive] = useState(false);

  const finalMessage = useMemo(() => {
    let msg = TEMPLATE_DEFS[selectedCategory].text[selectedLang];
    TEMPLATE_DEFS[selectedCategory].fields.forEach(f => {
      msg = msg.replace(`{{${f}}}`, fieldValues[f] || `[${f}]`);
    });
    return msg;
  }, [selectedCategory, selectedLang, fieldValues]);

  const addLog = (msg: string, channels: any) => {
    const newLog: AdvisoryLog = {
      id: Math.random().toString(36).substr(2, 9),
      templateId: selectedCategory,
      fields: { ...fieldValues },
      finalMessage: msg,
      channels,
      timestamp: new Date()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 8));
  };

  const triggerPushAndPA = async () => {
    setIsBroadcasting(true);
    setActiveAdvisory(finalMessage);
    await playPAAnnouncement(finalMessage, selectedLang);
    addLog(finalMessage, { push: 'EXECUTED', sms: 'IDLE', voice: 'SIMULATED' });
    setTimeout(() => setIsBroadcasting(false), 1500);
  };

  const triggerSmsSim = async () => {
    setIsSmsSending(true);
    // Simulate mobile reception delay
    setTimeout(() => {
      setActiveSms(finalMessage);
      addLog(finalMessage, { push: 'IDLE', sms: 'SMS alert delivered (simulation mode)', voice: 'IDLE' });
      setIsSmsSending(false);
    }, 1000);
  };

  const triggerIvrSim = async () => {
    setIsIvrActive(true);
    // Use the localized TTS as the "pre-recorded audio"
    await playPAAnnouncement(finalMessage, selectedLang);
    addLog(finalMessage, { push: 'IDLE', sms: 'IDLE', voice: 'IVR alert executed (simulation mode – pre-recorded audio)' });
    setTimeout(() => setIsIvrActive(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Dispatcher Configuration */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg text-white shadow-lg"><Terminal size={16} /></div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Advisory Command Node</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Unified Multi-Channel Simulation</p>
              </div>
            </div>
            <div className="flex bg-white border p-1 rounded-lg shadow-sm">
              {[Language.ENGLISH, Language.TELUGU, Language.HINDI].map(l => (
                <button 
                  key={l}
                  onClick={() => setSelectedLang(l)}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition-all ${selectedLang === l ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {l.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">1. Selection Logic</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(TEMPLATE_DEFS) as AdvisoryCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white hover:border-slate-300 text-slate-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      {cat === 'CONGESTION' && <AlertTriangle size={18} className={selectedCategory === cat ? 'text-orange-500' : 'text-slate-400'} />}
                      {cat === 'DARSHAN_PAUSE' && <Clock size={18} className={selectedCategory === cat ? 'text-blue-400' : 'text-slate-400'} />}
                      {cat === 'ROUTE_GUIDE' && <Route size={18} className={selectedCategory === cat ? 'text-green-400' : 'text-slate-400'} />}
                      {cat === 'EMERGENCY' && <ShieldAlert size={18} className={selectedCategory === cat ? 'text-red-500' : 'text-slate-400'} />}
                      <span className="text-[10px] font-bold uppercase tracking-tight">{cat.replace('_', ' ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">2. Injected Context</label>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                {TEMPLATE_DEFS[selectedCategory].fields.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">{field.replace('_', ' ')}</label>
                    <input 
                      value={fieldValues[field] || ''} 
                      onChange={(e) => setFieldValues(prev => ({...prev, [field]: e.target.value}))}
                      className="w-full bg-white border rounded-lg px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t space-y-4">
            <button 
              onClick={triggerPushAndPA}
              disabled={isBroadcasting}
              className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black shadow-lg transition-all active:scale-95"
            >
              {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
              Push & PA Announcement (Live Sim)
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={triggerSmsSim}
                disabled={isSmsSending}
                className="bg-white border text-slate-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
              >
                {isSmsSending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                SMS Dispatch (Sim)
              </button>
              <button 
                onClick={triggerIvrSim}
                disabled={isIvrActive}
                className="bg-white border text-slate-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
              >
                {isIvrActive ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
                Voice IVR (Sim)
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Preview Frame */}
        <div className="bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden h-[600px] flex flex-col">
          <div className="bg-slate-800 h-6 w-1/3 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />
          
          <div className="flex-1 bg-white flex flex-col relative overflow-y-auto pt-8">
            <div className="px-6 flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-slate-400">9:41</span>
              <div className="flex gap-1 items-center">
                <div className="w-4 h-2 bg-slate-200 rounded-sm"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>

            {/* PUSH OVERLAY */}
            {activeAdvisory && (
              <div className="absolute top-4 inset-x-4 z-40 animate-in slide-in-from-top duration-500">
                <div className="bg-white/95 backdrop-blur-md shadow-2xl border-l-4 border-l-orange-600 rounded-2xl p-4 flex gap-4 relative">
                  <button onClick={() => setActiveAdvisory(null)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-600"><X size={14}/></button>
                  <div className="bg-orange-600 p-2.5 rounded-xl text-white shrink-0 shadow-lg shadow-orange-600/20"><Bell size={18} /></div>
                  <div className="space-y-1.5 pr-4">
                    <p className="text-[9px] font-black uppercase text-orange-600 tracking-widest">Push Alert</p>
                    <p className="text-[11px] font-bold text-slate-900 leading-snug">{activeAdvisory}</p>
                  </div>
                </div>
              </div>
            )}

            {/* SMS OVERLAY */}
            {activeSms && (
              <div className="absolute top-24 inset-x-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-100 shadow-xl border rounded-2xl p-4 relative">
                  <button onClick={() => setActiveSms(null)} className="absolute top-2 right-2 text-slate-400"><X size={12}/></button>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Messages • 1m ago</p>
                  <p className="text-[10px] font-bold text-slate-800 leading-relaxed italic border-l-2 border-slate-300 pl-3">
                    "SVSD: {activeSms}"
                  </p>
                  <p className="text-[7px] font-black text-green-600 uppercase mt-2">Simulated SMS Reception</p>
                </div>
              </div>
            )}

            {/* IVR FLOW PREVIEW */}
            {isIvrActive && (
              <div className="absolute bottom-6 inset-x-4 z-40 animate-in slide-in-from-bottom duration-500">
                <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 space-y-3 shadow-2xl border border-white/10">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={14} className="text-green-400 animate-pulse" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-green-400">IVR Call Active</p>
                      </div>
                      <span className="text-[8px] font-bold bg-white/10 px-2 py-0.5 rounded">SIM_TTS</span>
                   </div>
                   <div className="space-y-1.5 pl-2 border-l-2 border-white/20">
                      <p className="text-[9px] opacity-40 uppercase font-black">Call Architecture</p>
                      <div className="text-[10px] font-bold flex flex-col gap-1">
                         <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> 1. Divine Greeting</span>
                         <span className="flex items-center gap-2 text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> 2. Playing Alert Audio</span>
                         <span className="flex items-center gap-2 opacity-30"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> 3. Wait for Ack (Key #1)</span>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-orange-600" />
                <h5 className="text-lg font-black text-slate-900 tracking-tight">DivyaDrishti Mobile</h5>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Official Pilgrim Portal</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <Smartphone size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Waiting for Alerts...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-slate-900 rounded-2xl border shadow-xl overflow-hidden flex flex-col h-[320px]">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Operational Advisory Log</h4>
          </div>
          <span className="text-[8px] font-black bg-white/10 text-white/40 px-3 py-1 rounded uppercase tracking-widest border border-white/10">PoC Simulation Layer</span>
        </div>
        <div className="flex-1 overflow-auto scrollbar-hide">
          <table className="w-full text-left text-slate-300">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md">
              <tr className="text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 w-32">Time</th>
                <th className="p-4 w-24">Template</th>
                <th className="p-4">Message Context</th>
                <th className="p-4 w-48">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-600 text-[10px] font-bold uppercase italic">Log entries will appear here upon multi-channel dispatch.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors animate-in fade-in slide-in-from-left-4 duration-300">
                  <td className="p-4 text-[10px] font-mono opacity-50">{log.timestamp.toLocaleTimeString()}</td>
                  <td className="p-4">
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-1 rounded font-black tracking-tight">{log.templateId}</span>
                  </td>
                  <td className="p-4 text-[10px] font-medium leading-relaxed truncate max-w-[200px]">{log.finalMessage}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      {log.channels.push !== 'IDLE' && (
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[8px] font-black text-green-500 uppercase">Push: Executed</span></div>
                      )}
                      {log.channels.sms !== 'IDLE' && (
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[8px] font-black text-blue-500 uppercase">SMS: {log.channels.sms}</span></div>
                      )}
                      {log.channels.voice !== 'IDLE' && (
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /><span className="text-[8px] font-black text-orange-500 uppercase">IVR: {log.channels.voice}</span></div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
