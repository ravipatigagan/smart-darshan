
import React, { useState } from 'react';
import { 
  Building2, Plus, ArrowRight, Layout, Camera, Layers, 
  Save, CheckCircle2, ShieldPlus, ChevronRight, Info,
  Map, Database, Zap, Sparkles
} from 'lucide-react';
import { TempleConfig, ZoneConfig } from '../types';

export const TempleOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<TempleConfig>>({
    archetype: 'QUAD_GOPURAM',
    zones: [],
    queueTypes: ['Dharma Darshan', 'Seeghra Darshan']
  });

  const addZone = () => {
    const newZone: ZoneConfig = {
      id: Math.random().toString(36).substr(2, 5),
      name: `Zone ${config.zones?.length || 0 + 1}`,
      type: 'QUEUE',
      cctvCount: 1
    };
    setConfig(prev => ({ ...prev, zones: [...(prev.zones || []), newZone] }));
  };

  const removeZone = (id: string) => {
    setConfig(prev => ({ ...prev, zones: prev.zones?.filter(z => z.id !== id) }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-600/20"><Building2 size={24} /></div>
             <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Onboard New Shrine</h2>
          </div>
          <p className="text-sm text-slate-400 font-medium">Standardized AI Deployment Architecture</p>
        </div>
        <div className="flex items-center gap-2">
           {[1, 2, 3].map(s => (
             <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${step >= s ? 'bg-orange-600' : 'bg-slate-200'}`} />
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Wizard Area */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-4">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Layout size={20} className="text-orange-600" /> 1. General Profile</h3>
                 <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temple Name</label>
                     <input 
                       className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                       placeholder="e.g., Ahobilam Narasimha Swamy Temple"
                       value={config.name}
                       onChange={(e) => setConfig({...config, name: e.target.value})}
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District / Region</label>
                     <input 
                       className="w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                       placeholder="e.g., Nandyal"
                       value={config.district}
                       onChange={(e) => setConfig({...config, district: e.target.value})}
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Architectural Archetype</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'QUAD_GOPURAM', label: 'Quad-Gopuram', icon: Map, desc: 'Large complex with 4 major entries' },
                      { id: 'LINEAR_CAVE', label: 'Linear Cave', icon: Layers, desc: 'Single entry/exit tunnel flow' }
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => setConfig({...config, archetype: type.id as any})}
                        className={`p-5 rounded-2xl border text-left transition-all ${config.archetype === type.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                      >
                         <type.icon size={20} className={config.archetype === type.id ? 'text-orange-500 mb-3' : 'text-slate-400 mb-3'} />
                         <p className="text-[11px] font-black uppercase tracking-tight mb-1">{type.label}</p>
                         <p className="text-[10px] opacity-60 font-medium">{type.desc}</p>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Camera size={20} className="text-orange-600" /> 2. Zone & CCTV Mapping</h3>
                 <button 
                   onClick={addZone}
                   className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-600/20"
                 >
                   <Plus size={14} /> Add Zone
                 </button>
               </div>

               <div className="space-y-3">
                 {config.zones?.length === 0 ? (
                   <div className="p-12 text-center border-2 border-dashed rounded-3xl space-y-3">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300"><Layers size={32} /></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">No active zones mapped</p>
                   </div>
                 ) : config.zones?.map((zone, idx) => (
                   <div key={zone.id} className="flex items-center gap-4 bg-slate-50 border p-4 rounded-2xl group">
                      <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center font-black text-slate-400">{idx + 1}</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <input 
                          value={zone.name}
                          onChange={(e) => {
                            const newZones = [...(config.zones || [])];
                            newZones[idx].name = e.target.value;
                            setConfig({...config, zones: newZones});
                          }}
                          className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                        />
                        <select 
                          value={zone.type}
                          className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none"
                          onChange={(e) => {
                            const newZones = [...(config.zones || [])];
                            newZones[idx].type = e.target.value as any;
                            setConfig({...config, zones: newZones});
                          }}
                        >
                          <option value="ENTRY">Entry Gate</option>
                          <option value="EXIT">Exit Gate</option>
                          <option value="QUEUE">Queue Hall</option>
                          <option value="SANCTUM">Sanctum</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                         <Camera size={12} className="text-slate-400" />
                         <span className="text-xs font-black text-slate-800">{zone.cctvCount}</span>
                      </div>
                      <button onClick={() => removeZone(zone.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Plus className="rotate-45" size={16} />
                      </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
               <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                 <ShieldPlus size={48} className="animate-bounce" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900">Configuration Finalized</h3>
                 <p className="text-sm text-slate-500 max-w-sm mx-auto">Temple blueprints are ready for AI engine deployment and state synchronization.</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border text-left space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Shrine Name</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase">{config.name || 'UNNAMED'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Zones Mapped</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase">{config.zones?.length} Zones</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Archetype</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase">{config.archetype}</span>
                  </div>
               </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button 
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 disabled:opacity-30"
            >
              Back
            </button>
            <button 
              onClick={() => step === 3 ? alert("System Deployed (PoC Mode)") : setStep(step + 1)}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-xl"
            >
              {step === 3 ? 'Deploy Node' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Database size={64} /></div>
            <div className="flex items-center gap-3 relative z-10">
              <Zap size={18} className="text-orange-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Scaling Blueprint</h4>
            </div>
            <div className="space-y-4 relative z-10">
               <div className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 shrink-0"><Sparkles size={20} /></div>
                  <div>
                    <p className="text-[11px] font-bold">Standardized Rollout</p>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-1">Reduces custom code overhead by using shared architectural templates across the state.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 shrink-0"><CheckCircle2 size={20} /></div>
                  <div>
                    <p className="text-[11px] font-bold">Centralized Governance</p>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-1">Every newly onboarded node automatically syncs with the Endowments State Hub.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
               <Info size={16} className="text-orange-600" />
               <p className="text-[10px] font-black uppercase tracking-widest text-orange-900">Why Template-Based?</p>
            </div>
            <p className="text-[11px] leading-relaxed text-orange-800/80 italic">
              "Mapping a temple's digital twin manually takes weeks. Our template engine reduces this to hours by providing pre-calculated heatmaps and queue configurations."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
