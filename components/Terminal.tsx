
import React, { useRef, useEffect, useState, memo } from 'react';
import { Agent, AgentStatus, LogEntry } from '../types';
import { Terminal as TerminalIcon, Play, Square, AlertTriangle, ShieldCheck, Cpu, Wifi } from 'lucide-react';

// --- Subcomponents for Performance ---

// Memoized Logs Component: Only re-renders when logs array reference changes
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
      className="flex-1 p-3 overflow-y-auto font-mono text-sm space-y-1 bg-[#0a0f1e]"
    >
      {logs.map((log) => (
        <div key={log.id} className="break-all whitespace-pre-wrap">
          <span className="text-slate-600 mr-3 select-none text-xs">
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
        <div className="flex items-center text-emerald-500 animate-pulse mt-1">
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
  isActive: boolean;
  onClick: () => void;
  latency?: number;
}

export const Terminal: React.FC<TerminalProps> = memo(({ 
  agent, 
  onSendCommand, 
  onApprove, 
  onDeny, 
  isActive,
  onClick,
  latency = 24
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

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

  const statusColor = {
    [AgentStatus.IDLE]: 'bg-slate-500',
    [AgentStatus.RUNNING]: 'bg-emerald-500',
    [AgentStatus.WAITING_APPROVAL]: 'bg-amber-500',
    [AgentStatus.ERROR]: 'bg-red-500',
    [AgentStatus.OFFLINE]: 'bg-slate-800',
  };

  return (
    <div 
      onClick={onClick}
      className={`
        flex flex-col h-full rounded-lg border bg-slate-900 overflow-hidden transition-all duration-200
        ${isActive ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-800 opacity-80 hover:opacity-100'}
      `}
    >
      {/* Header */}
      <div className={`
        flex items-center justify-between px-3 py-2 border-b 
        ${isActive ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor[agent.status]} ${agent.status === AgentStatus.RUNNING || agent.status === AgentStatus.WAITING_APPROVAL ? 'animate-pulse' : ''}`} />
          <span className="font-mono text-sm font-bold text-slate-200 tracking-tight">{agent.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase tracking-wider">
            {agent.template}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 opacity-60">
             <Wifi size={10} /> 
             <span>{latency}ms</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <Cpu size={12} />
            <span className={agent.resourceUsage.cpu > 80 ? 'text-amber-500' : ''}>{agent.resourceUsage.cpu}%</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            {agent.resourceUsage.ram}MB
          </div>
        </div>
      </div>

      {/* Memoized Output Area */}
      <TerminalLogs logs={agent.logs} status={agent.status} />

      {/* HITL Overlay or Input */}
      {agent.status === AgentStatus.WAITING_APPROVAL ? (
        <div className="border-t-2 border-amber-500/50 bg-amber-950/20 p-4 animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-1">Authorization Required</h4>
              <p className="text-slate-300 text-sm mb-3">
                Agent requested permission: <span className="font-mono bg-black/30 px-1 text-amber-200">{agent.pendingAction}</span>
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onApprove(agent.id); }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck size={14} /> APPROVE
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeny(agent.id); }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded transition-colors"
                >
                  DENY
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-900/50 p-2 flex items-center gap-2">
          <span className="text-emerald-500 font-bold ml-1 font-mono">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={agent.status === AgentStatus.OFFLINE}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-sm placeholder-slate-700"
            placeholder={isActive ? "Enter command..." : "Select terminal to type..."}
          />
        </form>
      )}
    </div>
  );
});

Terminal.displayName = 'Terminal';
