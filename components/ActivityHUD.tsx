
import React, { useEffect, useRef, useState } from 'react';
import { Activity, Wifi, Cpu, Radio, ArrowUp, ArrowDown } from 'lucide-react';
import { Agent, AgentStatus, GlobalEvent } from '../types';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ActivityHUDProps {
  cpuData: { time: string; value: number }[];
  agents: Agent[];
  events: GlobalEvent[];
  networkStats: { up: number; down: number; latency: number };
  onAgentSelect: (agentId: string) => void;
}

export const ActivityHUD: React.FC<ActivityHUDProps> = ({ cpuData, agents, events, networkStats, onAgentSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'SYSTEM' | 'SECURITY' | 'NETWORK'>('ALL');

  // Auto-scroll event log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, eventFilter]);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING: return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case AgentStatus.WAITING_APPROVAL: return 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]';
      case AgentStatus.ERROR: return 'bg-red-500';
      case AgentStatus.OFFLINE: return 'bg-slate-700';
      default: return 'bg-slate-500';
    }
  };

  const filteredEvents = events.filter(e => {
    if (eventFilter === 'ALL') return true;
    if (eventFilter === 'SYSTEM') return e.type === 'system' || e.type === 'agent';
    if (eventFilter === 'SECURITY') return e.type === 'security';
    if (eventFilter === 'NETWORK') return e.type === 'network';
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0 w-full md:h-48">
      
      {/* 1. System & Network Vitality (3 cols) */}
      <div className="md:col-span-3 h-48 md:h-full bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col relative overflow-hidden group">
        
        {/* Top Half: CPU Chart */}
        <div className="h-1/2 p-3 flex flex-col border-b border-slate-800/50">
          <div className="flex justify-between items-center mb-1 z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Activity size={14} /> System Load
            </div>
            <span className="text-slate-500 text-[10px] font-mono">{cpuData.length > 0 ? cpuData[cpuData.length-1].value : 0}%</span>
          </div>
          <div className="flex-1 relative z-10 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuData}>
                <defs>
                  <linearGradient id="hudCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#hudCpu)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Half: Network Stats */}
        <div className="h-1/2 p-3 bg-slate-900/30 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Wifi size={14} /> Network
                </div>
                <div className={`text-[10px] font-mono px-1.5 rounded transition-colors ${networkStats.latency > 100 ? 'text-amber-400 bg-amber-950' : 'text-slate-400 bg-slate-800'}`}>
                  {networkStats.latency}ms
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                <div className="p-1 bg-emerald-500/10 rounded text-emerald-500"><ArrowUp size={12}/></div>
                <div className="flex flex-col leading-none">
                   <span className="text-[9px] text-slate-500 uppercase">Up</span>
                   <span className="text-xs font-mono text-slate-200">{networkStats.up} <span className="text-[9px] text-slate-500">KB/s</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                <div className="p-1 bg-blue-500/10 rounded text-blue-500"><ArrowDown size={12}/></div>
                <div className="flex flex-col leading-none">
                   <span className="text-[9px] text-slate-500 uppercase">Down</span>
                   <span className="text-xs font-mono text-slate-200">{networkStats.down} <span className="text-[9px] text-slate-500">KB/s</span></span>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* 2. Agent Status Matrix (4 cols) */}
      <div className="md:col-span-4 h-48 md:h-full bg-slate-900/50 rounded-lg border border-slate-800 p-3 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Cpu size={14} /> Agent Matrix
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {agents.filter(a => a.status === AgentStatus.RUNNING).length} ACT
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {agents.length} TOT
            </span>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-5 gap-2 content-start overflow-y-auto min-h-0 pr-1">
          {agents.map(agent => (
            <button 
              key={agent.id} 
              onClick={() => onAgentSelect(agent.id)}
              className="aspect-square rounded bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-1 group relative cursor-pointer hover:border-indigo-500 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all"
              title={`Select ${agent.name} (${agent.status})`}
            >
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${getStatusColor(agent.status)}`} />
              
              {/* Mini Resource Bar */}
              <div className="w-4 h-0.5 bg-slate-800 rounded-full overflow-hidden mt-1 opacity-50 group-hover:opacity-100">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: `${agent.resourceUsage.cpu}%` }} 
                />
              </div>
            </button>
          ))}
          {/* Add Placeholder Slots to fill grid look */}
          {Array.from({ length: Math.max(0, 15 - agents.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-square rounded bg-slate-950/30 border border-slate-800/30 flex items-center justify-center opacity-50">
              <div className="w-1 h-1 rounded-full bg-slate-800" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Global Event Stream (5 cols) */}
      <div className="md:col-span-5 h-48 md:h-full bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/50 bg-slate-900/30 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Radio size={14} className={eventFilter === 'ALL' ? 'text-slate-400' : 'text-indigo-400'} /> Events
          </div>
          
          <div className="flex gap-1">
            {(['ALL', 'SYSTEM', 'SECURITY', 'NETWORK'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setEventFilter(filter)}
                className={`
                  px-1.5 py-0.5 text-[9px] font-bold rounded uppercase transition-colors
                  ${eventFilter === filter 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}
                `}
              >
                {filter.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2 min-h-0">
          {filteredEvents.map((event) => (
            <div key={event.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300 group">
              <span className="text-slate-600 shrink-0 group-hover:text-slate-500 transition-colors">
                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <span className={`
                truncate transition-colors
                ${event.type === 'security' ? 'text-amber-400 group-hover:text-amber-300' : ''}
                ${event.type === 'network' ? 'text-blue-300 group-hover:text-blue-200' : ''}
                ${event.type === 'agent' ? 'text-emerald-300 group-hover:text-emerald-200' : ''}
                ${event.type === 'system' ? 'text-slate-400 group-hover:text-slate-300' : ''}
              `}>
                <span className="opacity-50 mr-1.5 tracking-tighter">[{event.type.substring(0,3).toUpperCase()}]</span>
                {event.message}
              </span>
            </div>
          ))}
          {filteredEvents.length === 0 && <div className="text-slate-700 italic text-center mt-8">No events found.</div>}
        </div>
      </div>

    </div>
  );
};
