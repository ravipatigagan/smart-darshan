
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, FileText, Clock, History, CheckCircle2, 
  AlertCircle, ArrowRight, UserCheck, Download, Filter, 
  Search, HardDrive, Lock, Send, Megaphone, Info, 
  X, BarChart3, Shield, Siren, Stethoscope, ChevronRight,
  TrendingUp, PieChart, Activity, Zap, AlertTriangle, ClipboardCheck
} from 'lucide-react';
import { IncidentLifecycle, AdvisoryCategory } from '../types';

interface ComplianceVaultProps {
  incidents: IncidentLifecycle[];
}

type FilterStage = 'ALL' | 'ACTIVE' | 'RESOLVED';
type OverlayMode = 'LIST' | 'AUDIT' | 'GOVERNANCE';

interface AuditStep {
  action: string;
  authority: 'Temple Admin' | 'Police' | 'Endowments Dept' | 'Medical' | 'System AI';
  timestamp: Date;
  details: string;
}

export const ComplianceVault: React.FC<ComplianceVaultProps> = ({ incidents }) => {
  const [activeFilter, setActiveFilter] = useState<FilterStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('LIST');
  const [selectedIncident, setSelectedIncident] = useState<IncidentLifecycle | null>(null);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesStatus = activeFilter === 'ALL' || incident.status === activeFilter;
      const matchesSearch = 
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        incident.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [incidents, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const resolved = filteredIncidents.filter(i => i.status === 'RESOLVED').length;
    const critical = filteredIncidents.filter(i => i.severity === 'CRITICAL').length;
    
    // Mock MTTR calculation
    const avgResponseTime = "12m 45s";
    const complianceScore = 98.4;

    return { total, resolved, critical, avgResponseTime, complianceScore };
  }, [filteredIncidents]);

  const getAuditChain = (incident: IncidentLifecycle): AuditStep[] => {
    const steps: AuditStep[] = [
      {
        action: 'Anomaly Detected',
        authority: 'System AI',
        timestamp: incident.t1_detected,
        details: `Neural engine flagged ${incident.category.toLowerCase()} pattern.`
      }
    ];

    if (incident.t2_approved) {
      steps.push({
        action: 'Alert Verified',
        authority: 'Temple Admin',
        timestamp: incident.t2_approved,
        details: `Confirmed by ${incident.adminInvolved}. Human oversight active.`
      });
    }

    if (incident.t3_dispatched) {
      steps.push({
        action: 'Tactical Mobilization',
        authority: incident.severity === 'CRITICAL' ? 'Police' : 'Temple Admin',
        timestamp: incident.t3_dispatched,
        details: `Response units deployed to affected zone.`
      });
    }

    if (incident.status === 'RESOLVED' && incident.t4_resolved) {
      steps.push({
        action: 'Post-Incident Resolution',
        authority: 'Endowments Dept',
        timestamp: incident.t4_resolved,
        details: `Crowd flow restored. Regulatory audit finalized.`
      });
    }

    return steps;
  };

  const closeOverlay = () => {
    setOverlayMode('LIST');
    setSelectedIncident(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Audit/Governance Overlays */}
      {overlayMode !== 'LIST' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeOverlay}></div>
          <div className="relative bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl text-white shadow-xl ${overlayMode === 'AUDIT' ? 'bg-indigo-600' : 'bg-orange-600'}`}>
                    {overlayMode === 'AUDIT' ? <History size={24} /> : <BarChart3 size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      {overlayMode === 'AUDIT' ? `Audit Chain: ${selectedIncident?.id}` : 'Governance Summary Report'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {overlayMode === 'AUDIT' ? 'immutable temporal traceability' : 'Executive performance & compliance data'}
                    </p>
                  </div>
               </div>
               <button onClick={closeOverlay} className="p-3 bg-white border rounded-2xl hover:bg-slate-100 transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              {overlayMode === 'AUDIT' && selectedIncident && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="bg-slate-50 p-4 rounded-2xl border">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dossier Category</p>
                         <p className="text-sm font-black text-slate-800 uppercase">{selectedIncident.category}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">MTTR Performance</p>
                         <p className="text-sm font-black text-indigo-600">8m 22s <span className="text-[8px] text-green-500 underline ml-1">OPTIMAL</span></p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Governance Status</p>
                         <p className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase">
                           <Shield size={14} className="text-indigo-600" /> Compliant
                         </p>
                      </div>
                   </div>

                   <div className="relative pl-12 space-y-12">
                      <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-slate-100"></div>
                      {getAuditChain(selectedIncident).map((step, idx) => (
                        <div key={idx} className="relative group">
                           <div className={`absolute left-[-42px] top-0 w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white z-10 transition-transform group-hover:scale-110 ${
                             step.authority === 'System AI' ? 'bg-indigo-600' : 
                             step.authority === 'Temple Admin' ? 'bg-slate-800' :
                             step.authority === 'Police' ? 'bg-blue-600' : 
                             'bg-orange-600'
                           }`}>
                              {/* Fix: Zap was missing from imports */}
                              {step.authority === 'System AI' && <Zap size={16} />}
                              {step.authority === 'Temple Admin' && <UserCheck size={16} />}
                              {step.authority === 'Police' && <Siren size={16} />}
                              {step.authority === 'Endowments Dept' && <Shield size={16} />}
                           </div>
                           <div className="bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{step.action}</h5>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase">{step.authority}</p>
                                 </div>
                                 <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border">{step.timestamp.toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium italic">"{step.details}"</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {overlayMode === 'GOVERNANCE' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between h-40">
                         <PieChart size={24} className="opacity-40" />
                         <div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase">Compliance Index</p>
                            <h4 className="text-3xl font-black">98.4%</h4>
                         </div>
                      </div>
                      <div className="bg-white border p-6 rounded-3xl shadow-sm flex flex-col justify-between h-40">
                         <Activity size={24} className="text-orange-600 opacity-40" />
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Resolved In Range</p>
                            <h4 className="text-3xl font-black text-slate-900">{stats.resolved} <span className="text-xs font-bold text-slate-300">L4</span></h4>
                         </div>
                      </div>
                      <div className="bg-white border p-6 rounded-3xl shadow-sm flex flex-col justify-between h-40">
                         <TrendingUp size={24} className="text-green-600 opacity-40" />
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Audit Fidelity</p>
                            <h4 className="text-3xl font-black text-slate-900">High</h4>
                         </div>
                      </div>
                      <div className="bg-red-600 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between h-40">
                         {/* Fix: AlertTriangle was missing from imports */}
                         <AlertTriangle size={24} className="opacity-40" />
                         <div>
                            <p className="text-[10px] font-black text-red-200 uppercase">Risk Threshold</p>
                            <h4 className="text-3xl font-black">LOW</h4>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 border rounded-[2rem] p-8 space-y-6">
                      <h5 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                        {/* Fix: ClipboardCheck was missing from imports */}
                        <ClipboardCheck size={18} className="text-indigo-600" /> Executive Compliance Table
                      </h5>
                      <div className="overflow-hidden rounded-2xl border bg-white">
                         <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 border-b">
                               <tr className="font-black text-slate-400 uppercase tracking-widest">
                                  <th className="p-4">Authority Layer</th>
                                  <th className="p-4">Action Count</th>
                                  <th className="p-4">Avg Response</th>
                                  <th className="p-4">Integrity Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y">
                               {[
                                 { authority: 'System AI Engine', count: '100%', time: '< 1s', status: 'VERIFIED' },
                                 { authority: 'Temple Command', count: stats.resolved, time: stats.avgResponseTime, status: 'VERIFIED' },
                                 { authority: 'District Police', count: stats.critical, time: '18m', status: 'AUDITED' },
                                 { authority: 'Endowments Dept', count: 'All Logs', time: 'Weekly', status: 'SIGNED' },
                               ].map((row, i) => (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-black text-slate-900">{row.authority}</td>
                                    <td className="p-4 font-bold text-slate-600">{row.count}</td>
                                    <td className="p-4 font-bold text-slate-600">{row.time}</td>
                                    <td className="p-4">
                                       <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter border border-green-100">
                                          {row.status}
                                       </span>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-900 border-t flex justify-end gap-4 shrink-0">
               <button onClick={closeOverlay} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">
                  Close Review
               </button>
               <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all">
                  <Download size={16} /> Download Certified Dossier
               </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">MTTR (Avg)</p>
              <p className="text-2xl font-black text-green-400">{stats.avgResponseTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center gap-3">
               <Info size={16} className="text-orange-600 shrink-0" />
               <p className="text-[10px] font-bold text-orange-900 uppercase tracking-tighter">Certified Immutable Logs</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Log</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  placeholder="Incident ID or keyword..." 
                  className="w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Stage</label>
              <div className="space-y-2">
                {(['ALL', 'ACTIVE', 'RESOLVED'] as FilterStage[]).map(f => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFilter(f)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeFilter === f 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {f}
                    {activeFilter === f && <span className="float-right text-orange-500">●</span>}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setOverlayMode('GOVERNANCE')}
              className="w-full bg-orange-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-colors active:scale-95"
            >
              <BarChart3 size={14} /> View Governance Report
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
          {filteredIncidents.length === 0 ? (
            <div className="bg-white border rounded-2xl p-20 text-center space-y-4">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-200"><FileText size={40} /></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {searchQuery || activeFilter !== 'ALL' ? 'No matching logs found' : 'No Incident Logs to Display'}
              </p>
              {(searchQuery || activeFilter !== 'ALL') && (
                <button 
                  onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
                  className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-orange-600"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div key={incident.id} className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      incident.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {incident.severity}
                    </span>
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Audit {incident.category} Dossier • ID: {incident.id}</h5>
                    {incident.id.startsWith('INC-') && <span className="text-[8px] font-black text-slate-400 border border-slate-300 px-1.5 py-0.5 rounded bg-white">CERTIFIED</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[9px] font-mono text-slate-500">{incident.t1_detected.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-8">
                   <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex-1 space-y-4">
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                               {/* Fix: Zap was missing from imports */}
                               <Zap size={10} /> AI Event Detection
                            </p>
                            <p className="text-sm font-bold text-slate-800 italic">"{incident.description}"</p>
                         </div>
                         <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5">
                               <div className={`w-2 h-2 rounded-full ${incident.t2_approved ? 'bg-green-500' : 'bg-slate-200'}`} />
                               <span className="text-[9px] font-black text-slate-400 uppercase">Verification</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                               <div className={`w-2 h-2 rounded-full ${incident.t3_dispatched ? 'bg-green-500' : 'bg-slate-200'}`} />
                               <span className="text-[9px] font-black text-slate-400 uppercase">Dispatch</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                               <div className={`w-2 h-2 rounded-full ${incident.status === 'RESOLVED' ? 'bg-green-500' : 'bg-slate-200'}`} />
                               <span className="text-[9px] font-black text-slate-400 uppercase">Resolution</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="md:w-64 bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
                         <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-orange-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest">MTTR Efficiency</p>
                         </div>
                         <div>
                            <h4 className="text-2xl font-black">12.5m</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Audit Score: 100/100</p>
                         </div>
                         <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full" />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                   <button 
                     onClick={() => {
                        setSelectedIncident(incident);
                        setOverlayMode('AUDIT');
                     }}
                     className="px-6 py-3 text-[10px] font-black uppercase text-slate-600 hover:text-indigo-600 flex items-center gap-2 transition-all"
                   >
                     <History size={14} /> View Audit Chain
                   </button>
                   <button 
                     onClick={() => {
                        setSelectedIncident(incident);
                        setOverlayMode('GOVERNANCE');
                     }}
                     className="px-6 py-3 text-[10px] font-black uppercase bg-slate-900 text-white rounded-2xl shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95"
                   >
                     <ArrowRight size={14} /> Governance Report
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
