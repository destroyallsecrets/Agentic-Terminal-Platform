
import React, { useEffect, useRef } from 'react';
import { Activity, Wifi, Shield, Cpu, Zap, Radio, Lock } from 'lucide-react';
import { Agent, AgentStatus, GlobalEvent } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface ActivityHUDProps {
  cpuData: { time: string; value: number }[];
  agents: Agent[];
  events: GlobalEvent[];
  networkStats: { up: number; down: number; latency: number };
}

export const ActivityHUD: React.FC<ActivityHUDProps> = ({ cpuData, agents, events, networkStats }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING: return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case AgentStatus.WAITING_APPROVAL: return 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]';
      case AgentStatus.ERROR: return 'bg-red-500';
      case AgentStatus.OFFLINE: return 'bg-slate-700';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0 w-full md:h-48">
      
      {/* 1. System Vitality (3 cols) */}
      <div className="md:col-span-3 h-48 md:h-full bg-slate-900/50 rounded-lg border border-slate-800 p-3 flex flex-col relative overflow-hidden group">
        <div className="flex justify-between items-center mb-2 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Activity size={14} /> System Load
          </div>
          <span className="text-slate-500 text-[10px] font-mono">{networkStats.latency}ms</span>
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

        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 z-10">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Net Up</span>
            <span className="text-xs font-mono text-emerald-400">{networkStats.up} KB/s</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Net Down</span>
            <span className="text-xs font-mono text-blue-400">{networkStats.down} KB/s</span>
          </div>
        </div>
        
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
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
        
        <div className="flex-1 grid grid-cols-4 gap-2 content-start overflow-y-auto min-h-0 pr-1">
          {agents.map(agent => (
            <div 
              key={agent.id} 
              className="aspect-square rounded bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-1 group relative cursor-help transition-colors hover:border-slate-600"
              title={`${agent.name} - ${agent.status}`}
            >
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${getStatusColor(agent.status)}`} />
              <span className="text-[8px] font-mono text-slate-500 uppercase truncate w-full text-center px-1">
                {agent.name.split(' ')[0]}
              </span>
              
              {/* Mini Resource Bar */}
              <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: `${agent.resourceUsage.cpu}%` }} 
                />
              </div>
            </div>
          ))}
          {/* Add Placeholder Slots to fill grid look */}
          {Array.from({ length: Math.max(0, 8 - agents.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-square rounded bg-slate-950/30 border border-slate-800/30 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-800" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Global Event Stream (5 cols) */}
      <div className="md:col-span-5 h-48 md:h-full bg-slate-900/50 rounded-lg border border-slate-800 p-3 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Radio size={14} /> Event Uplink
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] text-blue-500 font-mono">LIVE</span>
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 pr-2 min-h-0">
          {events.map((event) => (
            <div key={event.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <span className={`
                truncate
                ${event.type === 'security' ? 'text-amber-400' : ''}
                ${event.type === 'network' ? 'text-blue-300' : ''}
                ${event.type === 'agent' ? 'text-emerald-300' : ''}
                ${event.type === 'system' ? 'text-slate-400' : ''}
              `}>
                <span className="opacity-50 mr-1">[{event.type.toUpperCase()}]</span>
                {event.message}
              </span>
            </div>
          ))}
          {events.length === 0 && <div className="text-slate-700 italic text-center mt-10">Waiting for uplink...</div>}
        </div>
      </div>

    </div>
  );
};
