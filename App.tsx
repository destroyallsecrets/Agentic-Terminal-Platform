
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Plus, Activity, Server, Shield, Wifi, LayoutGrid, RotateCcw, Database, Box, ChevronRight, ChevronLeft, Search, Command } from 'lucide-react';
import { Agent, AgentStatus, GlobalEvent, AgentConfig } from './types';
import { agentService } from './services/geminiService';
import { Terminal as TerminalComponent } from './components/Terminal';
import { ActivityHUD } from './components/ActivityHUD';
import { ProvisionModal } from './components/ProvisionModal';

// --- Types for Local State ---
interface MetricPoint {
  time: string;
  value: number;
}

const TEMPLATES = [
  "Python Coder",
  "Security Researcher",
  "DevOps Engineer",
  "Data Analyst"
];

// Random event generator data
const SYSTEM_MESSAGES = [
  "Verifying SSL handshake with host...",
  "Garbage collection started [PID 4092]",
  "Updating local package registry...",
  "Keep-alive packet sent to tunnel",
  "Re-allocating PRoot memory blocks",
  "Indexing filesystem changes..."
];

const SECURITY_MESSAGES = [
  "Port scan detected on 192.168.1.x (Ignored)",
  "HITL Request: File access verification",
  "Token refresh successful",
  "Encrypted tunnel re-established"
];

export default function App() {
  // -- State --
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [maximizedAgentId, setMaximizedAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostConnected, setHostConnected] = useState(false);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'DEVOPS' | 'SECURITY'>('ALL');
  
  // Navigation State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  // HUD State
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
  const [globalEvents, setGlobalEvents] = useState<GlobalEvent[]>([]);
  const [networkStats, setNetworkStats] = useState({ up: 12, down: 45, latency: 24 });

  // -- Initialization --
  const connectToHost = useCallback(() => {
    setHostConnected(false);
    setAgents([]);
    setCpuHistory([]);
    setGlobalEvents([]);
    setMaximizedAgentId(null);
    setActiveAgentId(null);
    setAgentSearch('');
    
    setTimeout(() => {
      setHostConnected(true);
      addEvent("Secure Bridge established via WireGuard", "network");
      addEvent("Host verified: sha256:8f4a...", "security");
      // Create default agents
      addAgent("Main Console", "DevOps Engineer", { ramLimit: 512, priority: 'high' });
      setTimeout(() => addAgent("Sentinel One", "Security Researcher", { ramLimit: 1024, priority: 'normal' }), 800);
    }, 1500);
  }, []);

  useEffect(() => {
    connectToHost();
  }, [connectToHost]);

  // -- Realtime Simulation Loop (Wired to State) --
  useEffect(() => {
    if (!hostConnected) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' });
      
      // Calculate System Load based on Active Agents
      const activeAgents = agents.filter(a => a.status === AgentStatus.RUNNING).length;
      const baseLoad = 5; // Idle OS overhead
      const loadPerAgent = 10; // % CPU per active agent
      const jitter = Math.floor(Math.random() * 8) - 4;
      const calculatedCpu = Math.min(100, Math.max(2, baseLoad + (activeAgents * loadPerAgent) + jitter));

      setCpuHistory(prev => [...prev.slice(-40), { time: timeStr, value: calculatedCpu }]);
      
      // Calculate Network Activity
      const baseDown = 2; // Keep-alive
      const downPerAgent = 85; // Log streaming
      const activeTraffic = activeAgents * downPerAgent;
      const networkJitter = Math.floor(Math.random() * 50);
      
      setNetworkStats({
        up: 5 + (activeAgents * 2) + Math.floor(Math.random() * 10), // Command traffic is low
        down: baseDown + activeTraffic + networkJitter,
        latency: Math.max(15, 24 + (activeAgents * 5) + (Math.floor(Math.random() * 10) - 5)) // Latency increases slightly with load
      });

      // Update agent resource usage randomly based on status
      setAgents(prev => prev.map(a => ({
        ...a,
        resourceUsage: {
          cpu: a.status === AgentStatus.RUNNING ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 5),
          ram: a.status === AgentStatus.RUNNING ? Math.floor(Math.random() * (a.config.ramLimit / 3)) + 128 : 64
        }
      })));

      // Randomly generate global events if things are quiet
      if (Math.random() > 0.85) {
        const typeRoll = Math.random();
        let msg = "", type: GlobalEvent['type'] = 'system';
        
        if (typeRoll > 0.8) {
           msg = SECURITY_MESSAGES[Math.floor(Math.random() * SECURITY_MESSAGES.length)];
           type = 'security';
        } else if (typeRoll > 0.5) {
           msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
           type = 'system';
        } else {
           msg = `Packet retransmit: Seq=${Math.floor(Math.random()*1000)}`;
           type = 'network';
        }
        addEvent(msg, type);
      }

    }, 1000);
    return () => clearInterval(interval);
  }, [hostConnected, agents.length]); 

  // -- Helpers --

  const addEvent = (message: string, type: GlobalEvent['type']) => {
    setGlobalEvents(prev => [...prev.slice(-50), {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      message,
      type
    }]);
  };

  const addAgent = (name: string, template: string, config: AgentConfig) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAgent: Agent = {
      id,
      name,
      template,
      status: AgentStatus.IDLE,
      logs: [{
        id: 'init',
        timestamp: Date.now(),
        content: `Initializing PRoot workspace for ${template}...\nConfig: ${config.ramLimit}MB RAM, ${config.priority.toUpperCase()} Priority\nMounting local filesystem...\nAgent ready.`,
        source: 'system',
        type: 'info'
      }],
      uptime: 0,
      resourceUsage: { cpu: 0, ram: 64 },
      config
    };
    setAgents(prev => [...prev, newAgent]);
    setActiveAgentId(id);
    addEvent(`Provisioned ${name} [${template}] (${config.ramLimit}MB)`, 'agent');
    setIsModalOpen(false);
  };

  // -- Handlers --
  const agentsRef = useRef(agents);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  const stableSendCommand = useCallback(async (agentId: string, cmd: string) => {
    const currentAgents = agentsRef.current;
    const agent = currentAgents.find(a => a.id === agentId);
    if (!agent) return;

    setNetworkStats(prev => ({ ...prev, up: prev.up + 150 }));

    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      return {
        ...a,
        status: AgentStatus.RUNNING,
        logs: [...a.logs, {
          id: Math.random().toString(),
          timestamp: Date.now(),
          content: `> ${cmd}`,
          source: 'stdout',
          type: 'info'
        }]
      };
    }));

    try {
      const approvalRequired = await agentService.sendCommand(
        agentId, 
        agent.template, 
        cmd, 
        (chunk) => {
          if (chunk) {
             setNetworkStats(prev => ({ ...prev, down: prev.down + 50 }));
             setAgents(prev => prev.map(a => {
                if (a.id !== agentId) return a;
                const lastLog = a.logs[a.logs.length - 1];
                if (lastLog && lastLog.source === 'stdout' && !lastLog.content.startsWith('>')) {
                   const newLogs = [...a.logs];
                   newLogs[newLogs.length - 1] = { ...lastLog, content: lastLog.content + chunk };
                   return { ...a, logs: newLogs };
                }
                return {
                    ...a,
                    logs: [...a.logs, {
                        id: Math.random().toString(),
                        timestamp: Date.now(),
                        content: chunk,
                        source: 'stdout',
                        type: 'info'
                    }]
                };
             }));
          }
        }
      );

      setAgents(prev => prev.map(a => {
        if (a.id !== agentId) return a;
        if (approvalRequired) {
          addEvent(`Agent ${a.name} requested elevated permission: ${approvalRequired}`, 'security');
          return { ...a, status: AgentStatus.WAITING_APPROVAL, pendingAction: approvalRequired };
        }
        return { ...a, status: AgentStatus.IDLE };
      }));

    } catch (e) {
       setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.ERROR } : a));
    }
  }, []);

  const stableApprove = useCallback((agentId: string) => {
    const agent = agentsRef.current.find(a => a.id === agentId);
    if (!agent) return;
    
    addEvent(`Admin APPROVED action for ${agent.name}`, 'security');
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.RUNNING, pendingAction: undefined } : a));
    
    agentService.sendCommand(agentId, agent.template, "APPROVED", (chunk) => {
        setAgents(prev => prev.map(a => {
           if (a.id !== agentId) return a;
           return {
               ...a,
               logs: [...a.logs, {
                   id: Math.random().toString(),
                   timestamp: Date.now(),
                   content: chunk,
                   source: 'stdout',
                   type: 'info'
               }]
           };
        }));
    }).then(() => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.IDLE } : a));
    });
  }, []);

  const stableDeny = useCallback((agentId: string) => {
    const agent = agentsRef.current.find(a => a.id === agentId);
    if (!agent) return;

    addEvent(`Admin DENIED action for ${agent.name}`, 'security');
    setAgents(prev => prev.map(a => a.id === agentId ? { 
        ...a, 
        status: AgentStatus.IDLE, 
        pendingAction: undefined,
        logs: [...a.logs, {
             id: Math.random().toString(),
             timestamp: Date.now(),
             content: "Permission Denied by Admin.",
             source: 'system',
             type: 'warning'
           }]
    } : a));
    
    agentService.sendCommand(agentId, agent.template, "DENIED", (chunk) => {
         setAgents(prev => prev.map(a => {
            if (a.id !== agentId) return a;
            return { ...a, logs: [...a.logs, { id: Math.random().toString(), timestamp: Date.now(), content: chunk, source: 'stdout', type: 'info' }] };
         }));
    });
  }, []);

  const clearLogs = useCallback((agentId: string) => {
    setAgents(prev => prev.map(a => {
        if (a.id !== agentId) return a;
        return {
            ...a,
            logs: [{
                id: Math.random().toString(),
                timestamp: Date.now(),
                content: "-- Logs cleared by user --",
                source: 'system',
                type: 'info'
            }]
        };
    }));
  }, []);

  const toggleMaximize = useCallback((agentId: string) => {
    setMaximizedAgentId(prev => prev === agentId ? null : agentId);
    setActiveAgentId(agentId);
  }, []);

  // Filter Agents based on sidebar selection
  const visibleAgents = agents.filter(a => {
      const matchSearch = agentSearch ? a.name.toLowerCase().includes(agentSearch.toLowerCase()) : true;
      if (!matchSearch) return false;
      if (viewFilter === 'ALL') return true;
      if (viewFilter === 'DEVOPS') return a.template.toLowerCase().includes('devops') || a.template.toLowerCase().includes('data');
      if (viewFilter === 'SECURITY') return a.template.toLowerCase().includes('security');
      return true;
  });

  // Calculate rendered agents based on maximization
  const renderedAgents = maximizedAgentId 
    ? visibleAgents.filter(a => a.id === maximizedAgentId) 
    : visibleAgents;

  const getStatusDotColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING: return 'bg-emerald-500 shadow-[0_0_6px_#10b981]';
      case AgentStatus.WAITING_APPROVAL: return 'bg-amber-500 animate-pulse';
      case AgentStatus.ERROR: return 'bg-red-500';
      case AgentStatus.OFFLINE: return 'bg-slate-700';
      default: return 'bg-slate-500';
    }
  };

  // -- Render --

  if (!hostConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-400 font-mono space-y-4">
        <Activity className="w-12 h-12 animate-pulse text-indigo-500" />
        <div className="text-xl">Establishing Secure Bridge to Host...</div>
        <div className="text-xs text-slate-600">Handshake: SHA-256 • Tunnel: WireGuard</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Expandable Sidebar Navigation */}
      <div className={`${isSidebarExpanded ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800 bg-slate-900 z-10 shrink-0 relative group/sidebar`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 rounded-full p-0.5 text-slate-400 hover:text-white hover:scale-110 transition-all z-20 shadow-md"
        >
          {isSidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Header/Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800/50 mb-2 overflow-hidden">
             <button 
                onClick={() => { setViewFilter('ALL'); setActiveAgentId(null); setMaximizedAgentId(null); }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isSidebarExpanded ? 'px-4 hover:bg-slate-800' : 'justify-center'}`}
                title="System Dashboard"
             >
                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 text-white">
                  <Terminal size={20} />
                </div>
                {isSidebarExpanded && <span className="font-bold text-slate-100 whitespace-nowrap">Console Root</span>}
             </button>
        </div>
        
        {/* View Filters */}
        <nav className="flex flex-col gap-1 w-full px-2 mb-4">
          <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 overflow-hidden">
             <LayoutGrid size={12} />
             {isSidebarExpanded && <span className="opacity-100 transition-opacity duration-300">Views</span>}
          </div>
          {[
              { id: 'ALL', icon: Command, label: 'All Operations' },
              { id: 'DEVOPS', icon: Server, label: 'DevOps & Infra' },
              { id: 'SECURITY', icon: Shield, label: 'Security Ops' }
          ].map((item) => (
            <button 
                key={item.id}
                onClick={() => { setViewFilter(item.id as any); setMaximizedAgentId(null); }}
                className={`
                  p-2.5 rounded-lg transition-all flex items-center relative group overflow-hidden
                  ${viewFilter === item.id 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300 border border-transparent'}
                  ${!isSidebarExpanded && 'justify-center'}
                `}
                title={!isSidebarExpanded ? item.label : ''}
            >
                <item.icon size={18} className="shrink-0" />
                {isSidebarExpanded && (
                  <span className="ml-3 text-sm font-medium whitespace-nowrap fade-in animate-in duration-300">{item.label}</span>
                )}
                {viewFilter === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-r-full"></div>}
            </button>
          ))}
        </nav>

        {/* Separator */}
        <div className="h-px bg-slate-800/50 w-full mb-4"></div>

        {/* Agent List (Nodes) */}
        <div className="flex flex-col w-full px-2 flex-1 min-h-0">
           <div className="px-2 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center overflow-hidden">
             <div className="flex items-center gap-2">
               <Database size={12} />
               {isSidebarExpanded && <span>Active Nodes</span>}
             </div>
             {isSidebarExpanded && (
               <span className="bg-slate-800 text-slate-400 px-1.5 rounded-full">{agents.length}</span>
             )}
           </div>
           
           {/* Search Box (Expanded Only) */}
           {isSidebarExpanded && (
             <div className="mb-2 px-1 animate-in fade-in zoom-in-95 duration-200">
               <div className="relative">
                 <Search size={12} className="absolute left-2.5 top-2 text-slate-500" />
                 <input 
                   type="text" 
                   value={agentSearch}
                   onChange={(e) => setAgentSearch(e.target.value)}
                   className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-1 pl-7 pr-2 text-xs text-slate-300 focus:border-indigo-500/50 focus:outline-none placeholder:text-slate-600"
                   placeholder="Filter nodes..."
                 />
               </div>
             </div>
           )}

           <div className={`flex flex-col gap-1 overflow-y-auto no-scrollbar ${!isSidebarExpanded && 'items-center'}`}>
             {agents.map(a => {
                const isMatch = !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase());
                if (!isMatch && isSidebarExpanded) return null;

                return (
                  <button 
                    key={a.id} 
                    onClick={() => { setActiveAgentId(a.id); if (maximizedAgentId) setMaximizedAgentId(a.id); }} 
                    className={`
                      rounded-md transition-all flex items-center relative group shrink-0
                      ${activeAgentId === a.id 
                        ? 'bg-slate-800 border-slate-700 shadow-sm' 
                        : 'hover:bg-slate-800/50 border-transparent border'}
                      ${isSidebarExpanded ? 'p-2' : 'p-1.5 w-8 h-8 justify-center'}
                    `}
                    title={`${a.name} - ${a.status}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(a.status)} shrink-0 transition-all ${activeAgentId === a.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    
                    {isSidebarExpanded && (
                      <div className="ml-3 text-left overflow-hidden min-w-0">
                        <div className={`text-xs font-medium truncate ${activeAgentId === a.id ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-300'}`}>{a.name}</div>
                        <div className="text-[9px] text-slate-600 truncate uppercase tracking-tight">{a.status === AgentStatus.WAITING_APPROVAL ? 'AUTHORIZE' : a.status}</div>
                      </div>
                    )}
                  </button>
                );
             })}
           </div>
        </div>

        {/* System Controls */}
        <div className="mt-auto flex flex-col gap-2 items-center w-full px-2 py-4 border-t border-slate-800 bg-slate-900">
           {isSidebarExpanded ? (
             <button 
              onClick={connectToHost}
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-500 hover:text-white hover:bg-red-900/20 border border-transparent hover:border-red-900/30 rounded-lg transition-all group"
             >
               <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" />
               <span className="text-xs font-medium">Reboot System</span>
             </button>
           ) : (
             <button 
              onClick={connectToHost}
              className="p-2 text-slate-500 hover:text-white hover:bg-red-500/20 rounded-lg transition-all group"
              title="Reboot System"
             >
               <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
             </button>
           )}
           <div className={`w-1.5 h-1.5 rounded-full ${hostConnected ? 'bg-emerald-500' : 'bg-red-500'}`} title={hostConnected ? "Bridge Active" : "Disconnected"}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b101b]">
        
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Box className="text-indigo-500" size={18} />
                <h1 className="font-bold text-base tracking-tight text-slate-100">LocalHost<span className="text-slate-600 font-normal">::</span>Supervisor</h1>
            </div>
            
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <Wifi size={10} strokeWidth={3} /> ONLINE
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 border border-indigo-400/50"
            >
              <Plus size={14} strokeWidth={3} />
              <span>PROVISION AGENT</span>
            </button>
          </div>
        </header>

        {/* Realtime Dashboard */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
          
          {/* HUD - Hide if an agent is maximized to give focus */}
          <div className={`transition-all duration-300 ease-in-out ${maximizedAgentId ? 'h-0 opacity-0 overflow-hidden mb-0' : 'h-auto opacity-100 mb-0'}`}>
            <ActivityHUD 
                cpuData={cpuHistory} 
                agents={agents} 
                events={globalEvents}
                networkStats={networkStats}
                onAgentSelect={(id) => { setActiveAgentId(id); setMaximizedAgentId(null); }}
            />
          </div>

          {/* Terminals Grid */}
          <div className={`flex-1 min-h-0 grid gap-6 pb-2 pr-2 transition-all duration-300 ${maximizedAgentId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'}`}>
            {renderedAgents.map(agent => (
              <TerminalComponent 
                key={agent.id}
                agent={agent}
                isActive={activeAgentId === agent.id}
                isMaximized={maximizedAgentId === agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                onSendCommand={stableSendCommand}
                onApprove={stableApprove}
                onDeny={stableDeny}
                onClearLogs={clearLogs}
                onToggleMaximize={toggleMaximize}
                latency={networkStats.latency}
              />
            ))}
            
            {renderedAgents.length === 0 && (
              <div className="col-span-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 rounded-xl text-slate-600 bg-slate-900/20">
                <Database size={48} className="mb-4 text-slate-700 opacity-50" />
                <p className="text-lg font-medium text-slate-500">No agents online.</p>
                <p className="text-sm text-slate-600 mb-6">Initialize a new runtime to begin.</p>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-indigo-400 border border-slate-700 transition-colors font-medium text-sm">
                    Provision First Agent
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <ProvisionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onProvision={addAgent}
        templates={TEMPLATES}
      />

    </div>
  );
}
