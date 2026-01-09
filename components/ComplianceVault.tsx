
import React from 'react';
import { 
  ShieldCheck, FileText, Clock, History, CheckCircle2, 
  AlertCircle, ArrowRight, UserCheck, Download, Filter, 
  Search, HardDrive, Lock
} from 'lucide-react';
import { IncidentLifecycle } from '../types';

interface ComplianceVaultProps {
  incidents: IncidentLifecycle[];
}

export const ComplianceVault: React.FC<ComplianceVaultProps> = ({ incidents }) => {
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Governance Summary */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Lock size={120} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={24} /></div>
              <h2 className="text-2xl font-black tracking-tight">Statutory Compliance Vault</h2>
            </div>
            <p className="text-sm text-slate-400 font-medium max-w-xl">
              Immutable operational audit logs. This data is stored in compliance with DPDP Act principles, ensuring pilgrim privacy while maintaining full executive accountability.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Audited</p>
              <p className="text-2xl font-black">{incidents.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">MTTR (Avg)</p>
              <p className="text-2xl font-black text-green-400">12m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Log</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input placeholder="Incident ID..." className="w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Stage</label>
              <div className="space-y-2">
                {['ALL', 'ACTIVE', 'RESOLVED'].map(f => (
                  <button key={f} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button className="w-full bg-orange-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
              <Download size={14} /> Export Governance Report
            </button>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
               <div className="bg-indigo-600 p-2 rounded-lg text-white"><HardDrive size={16} /></div>
               <h4 className="text-[11px] font-black uppercase text-indigo-900">Data Lifecycle</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-700 opacity-80">
              In alignment with state regulations, operational logs are retained for 365 days. Video metadata is purged every 30 days to protect pilgrim privacy.
            </p>
          </div>
        </div>

        {/* Timeline View */}
        <div className="xl:col-span-3 space-y-4">
          {incidents.length === 0 ? (
            <div className="bg-white border rounded-2xl p-20 text-center space-y-4">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-200"><FileText size={40} /></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Incident Logs to Display</p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div key={incident.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      incident.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {incident.severity}
                    </span>
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-700">{incident.category} • ID: {incident.id}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400">{incident.t1_detected.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-slate-100"></div>

                    <div className="space-y-8 relative">
                      {/* T1: Detection */}
                      <div className="flex items-start gap-6">
                        <div className="z-10 w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center text-white">
                          <AlertCircle size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">T1: AI Detection</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{incident.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-slate-400">
                            <span>GRID_STATUS: ANOMALY_DETECTED</span>
                            <span>•</span>
                            <span>CONFIDENCE: 98.4%</span>
                          </div>
                        </div>
                      </div>

                      {/* T2: Approval */}
                      <div className="flex items-start gap-6">
                        <div className={`z-10 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white ${
                          incident.t2_approved ? 'bg-indigo-500' : 'bg-slate-200'
                        }`}>
                          <UserCheck size={14} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                            incident.t2_approved ? 'text-indigo-600' : 'text-slate-400'
                          }`}>T2: Admin Intervention</p>
                          {incident.t2_approved ? (
                            <div className="mt-1">
                              <p className="text-xs font-bold text-slate-700 italic">"Approved for dispatch by {incident.adminInvolved}"</p>
                              <p className="text-[9px] font-mono text-slate-400 mt-1">LATENCY: {Math.round((incident.t2_approved.getTime() - incident.t1_detected.getTime()) / 1000)}s</p>
                            </div>
                          ) : <p className="text-xs text-slate-300 mt-1">Pending Human Review...</p>}
                        </div>
                      </div>

                      {/* T4: Resolution */}
                      <div className="flex items-start gap-6">
                        <div className={`z-10 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white ${
                          incident.t4_resolved ? 'bg-green-500' : 'bg-slate-200'
                        }`}>
                          <CheckCircle2 size={14} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                            incident.t4_resolved ? 'text-green-600' : 'text-slate-400'
                          }`}>T4: Tactical Resolution</p>
                          {incident.t4_resolved ? (
                            <div className="mt-1">
                              <p className="text-xs font-bold text-slate-700">Zone marked as NOMINAL. Pilgrim flow restored.</p>
                              <p className="text-[9px] font-mono text-slate-400 mt-1">
                                TOTAL LEAD TIME: {Math.round((incident.t4_resolved.getTime() - incident.t1_detected.getTime()) / 60000)}m
                              </p>
                            </div>
                          ) : <p className="text-xs text-slate-300 mt-1">Ground recovery in progress...</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                   <button className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-2">
                     <History size={14} /> Full Log
                   </button>
                   <button className="px-4 py-2 text-[10px] font-black uppercase bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2">
                     <ArrowRight size={14} /> Incident Dossier
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
