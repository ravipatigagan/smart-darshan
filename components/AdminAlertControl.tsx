
import React, { useState } from 'react';
import { 
  ShieldAlert, Check, X, Edit3, Send, AlertCircle, History, 
  UserCheck, Smartphone, MessageCircle, Clock, Zap, Terminal, CheckCircle2,
  ListChecks, ChevronRight, ClipboardList
} from 'lucide-react';
import { ProposedAlert, AlertAuditEntry, TacticalStep } from '../types';

interface AdminAlertControlProps {
  proposedAlerts: ProposedAlert[];
  onAction: (alertId: string, action: 'APPROVE' | 'REJECT' | 'EDIT', editedMessage?: string) => void;
  auditLogs: AlertAuditEntry[];
}

export const AdminAlertControl: React.FC<AdminAlertControlProps> = ({ 
  proposedAlerts, onAction, auditLogs 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [expandedPlaybookId, setExpandedPlaybookId] = useState<string | null>(null);

  const pending = proposedAlerts.filter(a => a.status === 'PENDING');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* AI Approval Queue (Decision Support Engine) */}
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-lg shadow-lg shadow-orange-600/20"><ShieldAlert size={18} /></div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest">Decision Support Engine</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Command & Control Pipeline</p>
              </div>
            </div>
            <span className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black border border-orange-600/20">
              {pending.length} PENDING
            </span>
          </div>

          {/* SCROLLABLE BOUNDING CONTAINER */}
          <div className="divide-y max-h-[600px] overflow-y-auto scrollbar-hide">
            {pending.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                   <CheckCircle2 className="text-slate-300" size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grid Nominal</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">No automated anomalies requiring intervention detected by Neural Engines.</p>
              </div>
            ) : pending.map(alert => (
              <div key={alert.id} className={`p-6 transition-all ${alert.severity === 'CRITICAL' ? 'bg-red-50/30' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alert.category} Dispatch</span>
                      <span className="text-[9px] font-mono text-slate-300 ml-auto">{alert.timestamp.toLocaleTimeString()}</span>
                    </div>

                    {editingId === alert.id ? (
                      <textarea 
                        value={editBuffer} 
                        onChange={(e) => setEditBuffer(e.target.value)}
                        className="w-full bg-slate-50 border rounded-xl p-4 text-sm font-medium outline-none h-24"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                        "{alert.message}"
                      </p>
                    )}

                    {/* Tactical Playbook Link */}
                    <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                       <button 
                         onClick={() => setExpandedPlaybookId(expandedPlaybookId === alert.id ? null : alert.id)}
                         className="flex items-center justify-between w-full"
                       >
                          <div className="flex items-center gap-2">
                             <ClipboardList size={14} className="text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Tactical Response Playbook</span>
                          </div>
                          <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedPlaybookId === alert.id ? 'rotate-90' : ''}`} />
                       </button>
                       
                       {expandedPlaybookId === alert.id && (
                         <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                            {alert.playbookSteps?.map((step, sidx) => (
                              <div key={step.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                 <div className="w-5 h-5 rounded-full bg-slate-100 border flex items-center justify-center shrink-0 font-black text-[10px] text-slate-400">{sidx + 1}</div>
                                 <p className="text-xs font-semibold text-slate-700">{step.instruction}</p>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Smartphone size={12} /> Web Push
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <MessageCircle size={12} /> WhatsApp (Sim)
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => onAction(alert.id, 'APPROVE', editingId === alert.id ? editBuffer : undefined)}
                      className="bg-slate-900 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black shadow-xl active:scale-95 transition-all"
                    >
                      <Check size={14} /> {editingId === alert.id ? 'Confirm & Dispatch' : 'Approve Protocol'}
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingId(editingId === alert.id ? null : alert.id);
                          setEditBuffer(alert.message);
                        }}
                        className="flex-1 bg-white border text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <Edit3 size={16} className="mx-auto" />
                      </button>
                      <button 
                        onClick={() => onAction(alert.id, 'REJECT')}
                        className="flex-1 bg-white border text-red-500 p-3 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <X size={16} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Audit Trail */}
      <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-3 shrink-0">
          <History size={18} className="text-orange-500" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Action Audit Trail</h4>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px] scrollbar-hide">
          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Terminal size={40} className="text-white mb-4" />
              <p className="text-[10px] text-white font-black uppercase tracking-widest">No Log Entries</p>
            </div>
          ) : auditLogs.map(log => (
            <div key={log.id} className="relative pl-6 border-l border-slate-700 py-1">
              <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-slate-900"></div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] font-black uppercase ${
                    log.action === 'APPROVE' ? 'text-green-500' : log.action === 'REJECT' ? 'text-red-500' : 'text-indigo-400'
                  }`}>
                    {log.action}D
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-tight">{log.details}</p>
                <div className="flex items-center gap-1 opacity-40">
                  <UserCheck size={10} className="text-white" />
                  <span className="text-[8px] font-black text-white uppercase">{log.admin}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
