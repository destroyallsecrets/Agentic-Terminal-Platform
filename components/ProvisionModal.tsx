
import React, { useState } from 'react';
import { Server, Cpu, Zap, X, Info } from 'lucide-react';
import { AgentConfig } from '../types';

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProvision: (name: string, template: string, config: AgentConfig) => void;
  templates: string[];
}

const TEMPLATE_INFO: Record<string, string> = {
  "Python Coder": "Specialized in data processing, script generation, and automation tasks. Pre-installed with NumPy, Pandas.",
  "Security Researcher": "Equipped with network analysis tools and vulnerability scanners. STRICT sandbox enforcement.",
  "DevOps Engineer": "Manages CI/CD pipelines, docker configurations, and system orchestration tasks.",
  "Data Analyst": "Optimized for large dataset queries and visualization generation. High memory profile recommended."
};

export const ProvisionModal: React.FC<ProvisionModalProps> = ({ isOpen, onClose, onProvision, templates }) => {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(templates[0]);
  const [ramLimit, setRamLimit] = useState(512);
  const [priority, setPriority] = useState<AgentConfig['priority']>('normal');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onProvision(name, template, { ramLimit, priority });
    setName('');
    setRamLimit(512);
    setPriority('normal');
    setTemplate(templates[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/20"><Server size={22}/></div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight">Provision New Agent</h2>
               <p className="text-slate-400 text-xs font-medium">Allocate resources for a new PRoot container instance</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Name Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Agent Identity</label>
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 pl-4 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-sm shadow-inner placeholder:text-slate-700"
                placeholder="e.g. backend-worker-node-04"
              />
              <div className="absolute right-3 top-4 text-xs font-mono text-slate-600">ID_REF</div>
            </div>
          </div>
          
          {/* Template Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">Runtime Environment</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(t => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`
                    text-left p-3 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden group
                    ${template === t 
                      ? 'bg-indigo-950/30 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'}
                  `}
                >
                  <div className="flex items-center gap-2 z-10">
                    <span className={`w-2.5 h-2.5 rounded-full ${template === t ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-700'}`}></span>
                    <span className={`font-semibold text-sm ${template === t ? 'text-indigo-200' : 'text-slate-400'}`}>{t}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-4 z-10">
                    {TEMPLATE_INFO[t] || "Standard execution environment."}
                  </p>
                  {template === t && <div className="absolute inset-0 bg-indigo-500/5 z-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 border-t border-slate-800/50">
            
            {/* RAM Slider */}
            <div>
              <label className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                <span>Memory Allocation</span>
                <span className={`font-mono ${ramLimit > 1024 ? 'text-amber-400' : 'text-indigo-400'}`}>{ramLimit} MB</span>
              </label>
              <div className="relative pt-2 pb-6 px-1">
                <input 
                  type="range" 
                  min="128" 
                  max="2048" 
                  step="128"
                  value={ramLimit}
                  onChange={(e) => setRamLimit(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-mono absolute w-full left-0 px-1">
                  <span>128MB</span>
                  <span>1024MB</span>
                  <span>2048MB</span>
                </div>
              </div>
            </div>

            {/* Priority Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">Process Priority</label>
              <div className="flex bg-slate-950 rounded-lg p-1.5 border border-slate-800">
                {(['low', 'normal', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-2 text-xs font-bold rounded-md capitalize transition-all flex items-center justify-center gap-2
                      ${priority === p 
                        ? (p === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : p === 'normal' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border border-slate-600')
                        : 'text-slate-600 hover:text-slate-400'}
                    `}
                  >
                    {p === 'high' && <Zap size={12} />}
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-6 py-4 flex gap-3 border-t border-slate-800 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white font-medium transition-colors text-sm"
          >
            Cancel Operations
          </button>
          <button 
            disabled={!name.trim()}
            onClick={handleSubmit}
            className="flex-[2] py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
          >
            <Zap size={18} fill="currentColor" />
            Initialize Agent Container
          </button>
        </div>

      </div>
    </div>
  );
};
