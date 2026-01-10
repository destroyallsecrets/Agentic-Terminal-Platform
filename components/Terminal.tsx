
import React, { useRef, useEffect, useState, memo } from 'react';
import { Agent, AgentStatus, LogEntry } from '../types';
import { Maximize2, Minimize2, Trash2, AlertTriangle, ShieldCheck, Cpu, Wifi, Copy, Check } from 'lucide-react';

// --- Subcomponents for Performance ---

const TerminalLogs = memo(({ logs, status }: { logs: LogEntry[], status: AgentStatus }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 bg-[#0a0f1e] scroll-smooth"
    >
      {logs.map((log) => (
        <div key={log.id} className="break-all whitespace-pre-wrap leading-relaxed group hover:bg-white/5 -mx-2 px-2 rounded">
          <span className="text-slate-600 mr-3 select-none text-[10px] opacity-50 group-hover:opacity-100 transition-opacity inline-block w-14">
            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className={
            log.source === 'stderr' ? 'text-red-400' : 
            (log.source === 'system' && log.type === 'info') ? 'text-blue-400 italic' : 
            log.type === 'success' ? 'text-emerald-400 font-bold' :
            log.type === 'warning' ? 'text-amber-400 font-bold' :
            'text-slate-300'
          }>
            {log.content}
          </span>
        </div>
      ))}
      {status === AgentStatus.RUNNING && (
        <div className="flex items-center text-emerald-500 animate-pulse mt-2">
          <span className="mr-2">▊</span>
        </div>
      )}
    </div>
  );
});

TerminalLogs.displayName = 'TerminalLogs';

// --- Main Component ---

interface TerminalProps {
  agent: Agent;
  onSendCommand: (agentId: string, cmd: string) => void;
  onApprove: (agentId: string) => void;
  onDeny: (agentId: string) => void;
  onClearLogs: (agentId: string) => void;
  onToggleMaximize: (agentId: string) => void;
  isActive: boolean;
  isMaximized: boolean;
  onClick: () => void;
  latency?: number;
}

export const Terminal: React.FC<TerminalProps> = memo(({ 
  agent, 
  onSendCommand, 
  onApprove, 
  onDeny, 
  onClearLogs,
  onToggleMaximize,
  isActive,
  isMaximized,
  onClick,
  latency = 24
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Focus input when active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || agent.status === AgentStatus.WAITING_APPROVAL) return;
    onSendCommand(agent.id, inputValue);
    setInputValue('');
  };

  const handleCopyLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = agent.logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.source.toUpperCase()}: ${l.content}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const statusColor = {
    [AgentStatus.IDLE]: 'bg-slate-500',
    [AgentStatus.RUNNING]: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    [AgentStatus.WAITING_APPROVAL]: 'bg-amber-500 animate-pulse',
    [AgentStatus.ERROR]: 'bg-red-500',
    [AgentStatus.OFFLINE]: 'bg-slate-800',
  };

  const statusText = {
    [AgentStatus.IDLE]: 'IDLE',
    [AgentStatus.RUNNING]: 'ACTIVE',
    [AgentStatus.WAITING_APPROVAL]: 'WAITING',
    [AgentStatus.ERROR]: 'ERROR',
    [AgentStatus.OFFLINE]: 'OFFLINE',
  };

  return (
    <div 
      onClick={onClick}
      className={`
        flex flex-col rounded-xl border bg-slate-900 overflow-hidden transition-all duration-300 h-full
        ${isActive ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg'}
        ${isMaximized ? 'z-40' : ''}
      `}
    >
      {/* Header */}
      <div className={`
        flex items-center justify-between px-4 py-3 border-b select-none
        ${isActive ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-slate-950/50 border-slate-800'}
      `}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
             <div className={`w-3 h-3 rounded-full transition-all duration-500 ${statusColor[agent.status]}`} />
             {agent.status === AgentStatus.WAITING_APPROVAL && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>}
          </div>
          <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-2">
                 <span className="font-mono text-sm font-bold text-slate-200 tracking-tight leading-none truncate">{agent.name}</span>
                 <span className={`text-[9px] font-bold px-1.5 rounded-sm border ${agent.status === AgentStatus.RUNNING ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 bg-slate-800'}`}>
                    {statusText[agent.status]}
                 </span>
             </div>
             <span className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5 truncate">{agent.template}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Stats */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
            <div className="flex items-center gap-1.5" title="Network Latency">
              <Wifi size={10} className={latency > 100 ? 'text-amber-500' : 'text-slate-600'} /> 
              <span>{latency}ms</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5" title="CPU Usage">
              <Cpu size={11} className={agent.resourceUsage.cpu > 80 ? 'text-amber-500' : 'text-slate-600'} />
              <span className={agent.resourceUsage.cpu > 80 ? 'text-amber-500' : ''}>{agent.resourceUsage.cpu}%</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button 
              onClick={handleCopyLogs}
              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors group"
              title="Copy All Logs"
            >
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClearLogs(agent.id); }}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              title="Clear Terminal Logs"
            >
              <Trash2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleMaximize(agent.id); }}
              className={`p-1.5 rounded transition-colors ${isMaximized ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800'}`}
              title={isMaximized ? "Minimize" : "Maximize (Focus Mode)"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Memoized Output Area */}
      <TerminalLogs logs={agent.logs} status={agent.status} />

      {/* HITL Overlay or Input */}
      {agent.status === AgentStatus.WAITING_APPROVAL ? (
        <div className="border-t border-amber-500/30 bg-amber-950/20 p-4 animate-in slide-in-from-bottom-2 fade-in backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                Authorization Required <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30">HITL</span>
              </h4>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Agent is requesting permission to execute: 
                <br/>
                <span className="font-mono bg-black/40 px-2 py-1 rounded text-amber-200 mt-1 inline-block border border-amber-500/20">{agent.pendingAction}</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onApprove(agent.id); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                  <ShieldCheck size={14} /> APPROVE ACTION
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeny(agent.id); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors border border-slate-700"
                >
                  DENY & ABORT
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`border-t bg-slate-900/80 p-3 flex items-center gap-3 transition-colors ${isActive ? 'border-indigo-500/30' : 'border-slate-800'}`}>
          <span className={`font-bold font-mono text-lg pl-1 ${isActive ? 'text-emerald-500' : 'text-slate-600'}`}>❯</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={agent.status === AgentStatus.OFFLINE}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-sm placeholder-slate-600 h-full py-1 focus:ring-0"
            placeholder={isActive ? "Enter command..." : "Select terminal to type..."}
          />
        </form>
      )}
    </div>
  );
});

Terminal.displayName = 'Terminal';
