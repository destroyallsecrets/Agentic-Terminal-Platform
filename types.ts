
export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  content: string;
  source: 'stdout' | 'stderr' | 'system';
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  template: string; // e.g., 'Python Coder', 'Security Researcher'
  status: AgentStatus;
  logs: LogEntry[];
  pendingAction?: string; // For HITL
  uptime: number;
  resourceUsage: {
    cpu: number; // percentage
    ram: number; // MB
  };
}

export interface SystemMetrics {
  cpuLoad: number;
  memoryUsage: number;
  activeTunnels: number;
  bytesIn: number;
  bytesOut: number;
}

export interface GlobalEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'system' | 'network' | 'security' | 'agent';
}
