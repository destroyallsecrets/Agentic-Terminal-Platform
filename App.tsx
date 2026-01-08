
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Plus, Activity, Server, Shield, Wifi, LayoutGrid, Github, Lock, Database } from 'lucide-react';
import { Agent, AgentStatus, LogEntry, GlobalEvent } from './types';
import { agentService } from './services/geminiService';
import { Terminal as TerminalComponent } from './components/Terminal';
import { ActivityHUD } from './components/ActivityHUD';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentTemplate, setNewAgentTemplate] = useState(TEMPLATES[0]);
  const [hostConnected, setHostConnected] = useState(false);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'DEVOPS' | 'SECURITY'>('ALL');

  // HUD State
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
  const [globalEvents, setGlobalEvents] = useState<GlobalEvent[]>([]);
  const [networkStats, setNetworkStats] = useState({ up: 12, down: 45, latency: 24 });

  // -- Initialization --
  useEffect(() => {
    // Simulate initial connection to Host
    const timer = setTimeout(() => {
      setHostConnected(true);
      addEvent("Secure Bridge established via WireGuard", "network");
      addEvent("Host verified: sha256:8f4a...", "security");
      // Create default agents
      addAgent("Main Console", "DevOps Engineer");
      setTimeout(() => addAgent("Sentinel One", "Security Researcher"), 800);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // -- Realtime Simulation Loop --
  useEffect(() => {
    if (!hostConnected) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' });
      
      // Update CPU Chart
      setCpuHistory(prev => [...prev.slice(-30), { time: timeStr, value: Math.floor(Math.random() * 40) + 10 }]);
      
      // Update Network Stats
      setNetworkStats({
        up: Math.floor(Math.random() * 50) + 10,
        down: Math.floor(Math.random() * 300) + 50,
        latency: Math.floor(Math.random() * 20) + 20
      });

      // Randomly update agent resource usage
      setAgents(prev => prev.map(a => ({
        ...a,
        resourceUsage: {
          cpu: a.status === AgentStatus.RUNNING ? Math.floor(Math.random() * 80) : Math.floor(Math.random() * 5),
          ram: a.status === AgentStatus.RUNNING ? Math.floor(Math.random() * 500) + 100 : 50
        }
      })));

      // Randomly generate global events
      if (Math.random() > 0.6) {
        const typeRoll = Math.random();
        let msg = "", type: GlobalEvent['type'] = 'system';
        
        if (typeRoll > 0.8) {
           msg = SECURITY_MESSAGES[Math.floor(Math.random() * SECURITY_MESSAGES.length)];
           type = 'security';
        } else {
           msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
           type = 'system';
        }
        addEvent(msg, type);
      }

    }, 1000);
    return () => clearInterval(interval);
  }, [hostConnected]);

  // -- Helpers --

  const addEvent = (message: string, type: GlobalEvent['type']) => {
    setGlobalEvents(prev => [...prev.slice(-50), {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      message,
      type
    }]);
  };

  const addAgent = (name: string, template: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAgent: Agent = {
      id,
      name,
      template,
      status: AgentStatus.IDLE,
      logs: [{
        id: 'init',
        timestamp: Date.now(),
        content: `Initializing PRoot workspace for ${template}...\nMounting local filesystem...\nAgent ready.`,
        source: 'system',
        type: 'info'
      }],
      uptime: 0,
      resourceUsage: { cpu: 0, ram: 128 }
    };
    setAgents(prev => [...prev, newAgent]);
    setActiveAgentId(id);
    addEvent(`Provisioned new agent: ${name} [${template}]`, 'agent');
    setIsModalOpen(false);
    setNewAgentName('');
  };

  // -- Handlers (Stable) --
  const agentsRef = useRef(agents);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  const stableSendCommand = useCallback(async (agentId: string, cmd: string) => {
    const currentAgents = agentsRef.current;
    const agent = currentAgents.find(a => a.id === agentId);
    if (!agent) return;

    // Optimistic Update
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

  // Filter Agents based on sidebar selection
  const visibleAgents = agents.filter(a => {
      if (viewFilter === 'ALL') return true;
      if (viewFilter === 'DEVOPS') return a.template.toLowerCase().includes('devops') || a.template.toLowerCase().includes('data');
      if (viewFilter === 'SECURITY') return a.template.toLowerCase().includes('security');
      return true;
  });

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
      
      {/* Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 border-r border-slate-800 bg-slate-900 z-10">
        <div className="p-2 bg-indigo-600 rounded-lg mb-6 shadow-lg shadow-indigo-500/20 cursor-pointer hover:bg-indigo-500 transition-colors" title="System Dashboard">
          <Terminal size={24} className="text-white" />
        </div>
        
        <nav className="flex flex-col gap-4 w-full px-2">
          <button 
            onClick={() => setViewFilter('ALL')}
            className={`p-3 rounded-lg transition-all ${viewFilter === 'ALL' ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            title="All Agents"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewFilter('DEVOPS')}
            className={`p-3 rounded-lg transition-all ${viewFilter === 'DEVOPS' ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            title="DevOps & Infrastructure"
          >
            <Server size={20} />
          </button>
          <button 
            onClick={() => setViewFilter('SECURITY')}
            className={`p-3 rounded-lg transition-all ${viewFilter === 'SECURITY' ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            title="Security Operations"
          >
            <Shield size={20} />
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
           <div className={`w-2 h-2 rounded-full mx-auto ${hostConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} title={hostConnected ? "Bridge Active" : "Disconnected"}></div>
           <button className="p-3 text-slate-600 hover:text-slate-400">
             <Github size={20} />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b101b]">
        
        {/* Top Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg tracking-tight text-slate-100">LocalHost<span className="text-slate-600">::</span>Supervisor</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-mono font-medium border border-emerald-500/20 flex items-center gap-1.5">
              <Wifi size={10} /> ENCRYPTED
            </span>
            {viewFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700">
                FILTER: {viewFilter}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
              <Plus size={16} />
              <span>New Agent</span>
            </button>
          </div>
        </header>

        {/* Realtime Dashboard */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
          
          {/* New Realtime Activity HUD */}
          <ActivityHUD 
            cpuData={cpuHistory} 
            agents={agents} 
            events={globalEvents}
            networkStats={networkStats}
          />

          {/* Terminals Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 overflow-y-auto pb-2 pr-2">
            {visibleAgents.map(agent => (
              <TerminalComponent 
                key={agent.id}
                agent={agent}
                isActive={activeAgentId === agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                onSendCommand={stableSendCommand}
                onApprove={stableApprove}
                onDeny={stableDeny}
                latency={networkStats.latency}
              />
            ))}
            
            {visibleAgents.length === 0 && (
              <div className="col-span-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg text-slate-600 bg-slate-900/20">
                <Database size={48} className="mb-4 text-slate-700" />
                <p className="text-lg font-medium">No agents found in this view.</p>
                <p className="text-sm">Check your filters or provision a new agent.</p>
                <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-indigo-400 border border-slate-700 transition-colors">Provision Agent</button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* New Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-1">
               <div className="p-2 bg-indigo-500/20 rounded text-indigo-400"><Server size={20}/></div>
               <h2 className="text-xl font-bold text-white">Provision New Agent</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6 pl-11">Allocate a new PRoot container for a specialized task.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Agent Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Backend Refactor"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t}
                      onClick={() => setNewAgentTemplate(t)}
                      className={`
                        text-left p-2 rounded border text-sm transition-all flex items-center gap-2
                        ${newAgentTemplate === t 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${newAgentTemplate === t ? 'bg-indigo-400' : 'bg-slate-700'}`}></span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!newAgentName.trim()}
                  onClick={() => addAgent(newAgentName, newAgentTemplate)}
                  className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Spin Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
