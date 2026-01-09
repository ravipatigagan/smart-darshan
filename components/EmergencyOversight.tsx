
import React from 'react';
import { 
  ShieldAlert, Phone, Ambulance, Siren, Radio, Map, 
  AlertTriangle, Clock, UserCheck, Flame, Info, ChevronRight,
  Stethoscope, Shield, BellRing, Navigation
} from 'lucide-react';
import { IncidentLifecycle } from '../types';

interface EmergencyOversightProps {
  incidents: IncidentLifecycle[];
}

const EMERGENCY_CONTACTS = [
  { department: 'Police Command', role: 'Crowd Control / L&O', contact: '08812-277100', icon: Shield },
  { department: 'Medical (108)', role: 'Casualty Evacuation', contact: '108 / 102', icon: Stethoscope },
  { department: 'Fire & Safety', role: 'Disaster Mitigation', contact: '101', icon: Flame },
  { department: 'NDRF Base', role: 'Search & Rescue', contact: '+91-11-24363260', icon: Siren },
];

export const EmergencyOversight: React.FC<EmergencyOversightProps> = ({ incidents }) => {
  const activeCritical = incidents.filter(i => i.severity === 'CRITICAL' && i.status === 'ACTIVE');
  const sosEvents = incidents.filter(i => i.isSOS && i.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* War Room Header */}
      <div className="bg-red-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border-b-8 border-red-900/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse"><ShieldAlert size={140} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20"><Radio size={28} className="animate-pulse" /></div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Emergency Command oversight</h2>
             </div>
             <p className="text-sm text-red-100 font-bold opacity-80 max-w-2xl">
               Real-time state-level intervention portal. Use this view to coordinate between Police, Medical, and District Administration during high-risk anomalies.
             </p>
          </div>
          <div className="flex gap-4 shrink-0">
             <div className="bg-red-900/40 border border-white/10 p-5 rounded-2xl text-center min-w-[140px] backdrop-blur-md">
                <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-1">Active Critical</p>
                <p className="text-4xl font-black">{activeCritical.length}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl text-center min-w-[140px] shadow-xl">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Total SOS</p>
                <p className="text-4xl font-black text-slate-900">{sosEvents.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Coordination Directory */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Phone size={18} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Inter-Dept Contacts</h3>
             </div>
             <div className="space-y-4">
                {EMERGENCY_CONTACTS.map((contact, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border rounded-2xl group hover:bg-slate-900 hover:text-white transition-all">
                     <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-xl text-slate-400 group-hover:text-orange-500 shadow-sm"><contact.icon size={18} /></div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase tracking-tight">{contact.department}</p>
                           <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">{contact.role}</p>
                        </div>
                     </div>
                     <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black font-mono tracking-widest">{contact.contact}</span>
                        <button className="text-[9px] font-black uppercase text-orange-600 group-hover:text-white underline tracking-widest">Call Now</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <BellRing size={20} className="animate-bounce" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Escalation SLA</h4>
             </div>
             <p className="text-[11px] leading-relaxed opacity-90 font-medium">
               Anomalies detected in "Queue Complex" or "Sanctum" that remain critical for >300s are automatically flagged for direct Ministerial intervention.
             </p>
             <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase">
                <span>Auto-Purge</span>
                <span>24H Post-Event</span>
             </div>
          </div>
        </div>

        {/* Live Critical Feed */}
        <div className="xl:col-span-3 space-y-6">
          {activeCritical.length === 0 && sosEvents.length === 0 ? (
            <div className="bg-white border rounded-3xl p-24 text-center space-y-6">
               <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-500"><Navigation size={48} /></div>
               <div>
                  <h4 className="text-lg font-black text-slate-900 uppercase">System Status: Nominal</h4>
                  <p className="text-sm text-slate-400 font-medium mt-1 italic">No critical life-safety threats detected across the state grid.</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
               {activeCritical.map(incident => (
                 <div key={incident.id} className="bg-white border-2 border-red-100 rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row h-full">
                       <div className="bg-red-600 text-white p-6 md:w-48 flex flex-col justify-center items-center text-center gap-2">
                          <AlertTriangle size={32} className="animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Zone Breach</p>
                          <p className="text-xl font-black">CRITICAL</p>
                       </div>
                       <div className="flex-1 p-6 space-y-4">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{incident.category} • {incident.id}</h4>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase mt-1">
                                   <Clock size={12} /> Detected {Math.round((Date.now() - incident.t1_detected.getTime()) / 1000)}s ago
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded text-[9px] font-black uppercase border tracking-tighter">Read-Only Oversight</span>
                             </div>
                          </div>
                          
                          <div className="bg-slate-50 p-4 rounded-2xl border flex items-center gap-4">
                             <div className="bg-white p-3 rounded-xl border shadow-sm text-red-600"><ShieldAlert size={20}/></div>
                             <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-800 leading-snug">"{incident.description}"</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Recommended Resource: Local Police QR Team</p>
                             </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                             <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                   {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">P{i}</div>)}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">3 Agencies Notified</span>
                             </div>
                             <button className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 hover:underline">
                                Mobilize Response <ChevronRight size={14} />
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}

               {sosEvents.map(sos => (
                 <div key={sos.id} className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row gap-8 shadow-2xl relative border-l-8 border-orange-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Siren size={100}/></div>
                    <div className="bg-orange-600 p-6 rounded-3xl shrink-0 flex flex-col items-center justify-center gap-2">
                       <p className="text-3xl font-black">SOS</p>
                       <Phone size={24} className="animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                             <Siren size={12} /> Emergency Signal: Active
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{sos.t1_detected.toLocaleTimeString()}</p>
                       </div>
                       <h4 className="text-xl font-black tracking-tight leading-tight italic">"{sos.description}"</h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                             <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Type</p>
                             <p className="text-[10px] font-bold">Medical Help</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                             <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Accuracy</p>
                             <p className="text-[10px] font-bold">94% Confidence</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10 col-span-2 md:col-span-1">
                             <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Assigned Unit</p>
                             <p className="text-[10px] font-bold text-orange-400">AMBULANCE_G2</p>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Governance Legend */}
          <div className="bg-white border rounded-3xl p-8 flex items-center gap-8 shadow-sm">
             <div className="bg-slate-100 p-5 rounded-3xl text-slate-400 shrink-0"><Map size={32} /></div>
             <div className="flex-1 space-y-2">
                <h5 className="text-sm font-black text-slate-900 uppercase">Unified Command Protocol</h5>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                  This oversight portal provides inter-departmental visibility. Local temple administration retains primary command unless a <b>State of Emergency</b> is officially declared via this dashboard by a Level-4 Administrator.
                </p>
             </div>
             <div className="flex gap-4 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border">
                   <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                   <span className="text-[9px] font-black uppercase">Crisis</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="text-[9px] font-black uppercase">Mobilized</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
