
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Bell, Smartphone, Send, Megaphone, Volume2, Globe, AlertTriangle, 
  Route, Clock, X, Info, ClipboardList, CheckCircle2, Terminal, User, Loader2
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
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const finalMessage = useMemo(() => {
    let msg = TEMPLATE_DEFS[selectedCategory].text[selectedLang];
    TEMPLATE_DEFS[selectedCategory].fields.forEach(f => {
      msg = msg.replace(`{{${f}}}`, fieldValues[f] || `[${f}]`);
    });
    return msg;
  }, [selectedCategory, selectedLang, fieldValues]);

  const triggerBroadcast = async () => {
    setIsBroadcasting(true);
    
    // 1. Web Push (Live Update)
    setActiveAdvisory(finalMessage);
    
    // 2. PA Voice (TTS Simulation)
    await playPAAnnouncement(finalMessage, selectedLang);
    
    // 3. Log the event
    const newLog: AdvisoryLog = {
      id: Math.random().toString(36).substr(2, 9),
      templateId: selectedCategory,
      fields: { ...fieldValues },
      finalMessage,
      channels: { push: 'EXECUTED', sms: 'SIMULATED', voice: 'SIMULATED' },
      timestamp: new Date()
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 5));
    setTimeout(() => setIsBroadcasting(false), 1500);
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
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Advisory Command Node</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Template-Based Governance</p>
              </div>
            </div>
            <div className="flex bg-white border p-1 rounded-lg shadow-sm">
              {[Language.ENGLISH, Language.TELUGU, Language.HINDI].map(l => (
                <button 
                  key={l}
                  onClick={() => setSelectedLang(l)}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition-all ${selectedLang === l ? 'bg-orange-600 text-white' : 'text-slate-400'}`}
                >
                  {l.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">1. Select Strategy Template</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(TEMPLATE_DEFS) as AdvisoryCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-slate-900/10' : 'bg-white hover:border-slate-300 text-slate-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      {cat === 'CONGESTION' && <AlertTriangle size={18} className={selectedCategory === cat ? 'text-orange-500' : 'text-slate-400'} />}
                      {cat === 'DARSHAN_PAUSE' && <Clock size={18} className={selectedCategory === cat ? 'text-blue-400' : 'text-slate-400'} />}
                      {cat === 'ROUTE_GUIDE' && <Route size={18} className={selectedCategory === cat ? 'text-green-400' : 'text-slate-400'} />}
                      {cat === 'EMERGENCY' && <ShieldAlert size={18} className={selectedCategory === cat ? 'text-red-500' : 'text-slate-400'} />}
                      <span className="text-[10px] font-bold uppercase tracking-tight">{cat.replace('_', ' ')}</span>
                    </div>
                    {selectedCategory === cat && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">2. Contextual Data Injection</label>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                {TEMPLATE_DEFS[selectedCategory].fields.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">{field.replace('_', ' ')}</label>
                    <input 
                      value={fieldValues[field] || ''} 
                      onChange={(e) => setFieldValues(prev => ({...prev, [field]: e.target.value}))}
                      className="w-full bg-white border rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
              </div>
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <p className="text-[9px] text-orange-800 leading-relaxed italic">
                  <b>Rule:</b> Core template structure is protected. Admin only modifies contextual variables to maintain organizational consistency.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t grid grid-cols-2 gap-4">
            <button 
              onClick={triggerBroadcast}
              disabled={isBroadcasting}
              className="bg-slate-900 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black shadow-lg transition-all active:scale-95"
            >
              {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Push & PA Broadcast (Live)
            </button>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => {
                  console.log(`[SIMULATION] SMS alert queued / delivered: ${finalMessage}`);
                  alert("SMS Simulation: Message logged to terminal.");
                }}
                className="bg-white border text-slate-600 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
              >
                <Smartphone size={14} /> SMS Dispatch (Sim)
              </button>
              <button 
                className="bg-white border text-slate-600 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <Volume2 size={14} /> Voice IVR (Sim)
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Preview Frame */}
        <div className="bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden h-[540px] flex flex-col">
          <div className="bg-slate-800 h-6 w-1/3 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />
          
          <div className="flex-1 bg-white flex flex-col relative overflow-y-auto pt-8">
            <div className="px-6 flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-slate-400">9:41</span>
              <div className="flex gap-1 items-center">
                <div className="w-4 h-2 bg-slate-200 rounded-sm"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>

            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-orange-600" />
                <h5 className="text-lg font-black text-slate-900 tracking-tight">Divine Sight</h5>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Official Pilgrim Portal</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="h-40 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 <div className="text-center z-10">
                    <MapPin size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Live Dynamic Map</p>
                 </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              </div>
            </div>

            {/* PUSH OVERLAY */}
            {activeAdvisory && (
              <div className="absolute top-4 inset-x-4 z-30 animate-in slide-in-from-top duration-500">
                <div className="bg-white/95 backdrop-blur-md shadow-2xl border-l-4 border-l-orange-600 rounded-2xl p-4 flex gap-4 relative">
                  <button onClick={() => setActiveAdvisory(null)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-600 transition-colors"><X size={14}/></button>
                  <div className="bg-orange-600 p-2.5 rounded-xl text-white shrink-0 shadow-lg shadow-orange-600/20">
                    <Megaphone size={18} />
                  </div>
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-black uppercase text-orange-600 tracking-widest">Safety Advisory</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 leading-snug">{activeAdvisory}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Tap for Alternate Route Guidance</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto p-6 space-y-3">
               <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-slate-900 rounded-xl flex items-center justify-center gap-2 text-white text-[10px] font-bold uppercase">
                     <User size={14} /> My Profile
                  </div>
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white">
                     <Bell size={20} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-slate-900 rounded-2xl border shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} className="text-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Operational Advisory Log</h4>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-green-500 uppercase">Gateway Active</span>
          </div>
        </div>
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Template</th>
                <th className="p-4">Contextual Message</th>
                <th className="p-4">Channel Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-600 text-[10px] font-bold uppercase italic">No advisories dispatched in this session.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-[10px] font-mono opacity-50 whitespace-nowrap">{log.timestamp.toLocaleTimeString()}</td>
                  <td className="p-4">
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-1 rounded font-black tracking-tight">{log.templateId}</span>
                  </td>
                  <td className="p-4 text-[10px] font-medium leading-relaxed max-w-md">{log.finalMessage}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[8px] font-black text-green-500 uppercase">Push: OK</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-[8px] font-black text-blue-500 uppercase">SMS: SIM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        <span className="text-[8px] font-black text-orange-500 uppercase">PA: SIM</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-800/50 text-[9px] font-bold text-slate-500 italic flex items-center gap-2">
          <Info size={12} />
          Note: SMS and voice alerts are demonstrated in simulation mode for PoC stability and regulatory compliance.
        </div>
      </div>
    </div>
  );
};

const MapPin = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);
