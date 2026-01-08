import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { LogEntry } from "../types";

// NOTE: In a real app, this would be a WebSocket service connecting to the Rust Desktop App.
// Here, we simulate the "Desktop" and "Agent" logic using Gemini directly.

const getSystemInstruction = (template: string) => `
You are a high-performance AI agent running inside a stripped-down PRoot container on a local host.
Your role is: ${template}.
You are controlled via a remote web terminal.

OUTPUT FORMAT RULES:
1. You act as a Linux terminal. Output standard stdout/stderr logs.
2. If the user asks for a dangerous operation (file deletion 'rm', network config 'ip', system shutdown, sudo), 
   you MUST STOP and output exactly: [[APPROVAL_REQUIRED: <description of action>]]
3. If you receive "APPROVED", proceed with the action.
4. If you receive "DENIED", abort and log "Permission denied.".
5. Keep responses concise and technical, like a log stream.
6. Do not use Markdown formatting like **bold** or \`code\` blocks unless generating code files. 
   Keep it raw text for terminal rendering.
7. If the task is complex, briefly list the steps you are taking as log output before executing.
`;

export class AgentService {
  private ai: GoogleGenAI;
  private chatSessions: Map<string, Chat>;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.chatSessions = new Map();
  }

  private getChat(agentId: string, template: string): Chat {
    if (!this.chatSessions.has(agentId)) {
      const chat = this.ai.chats.create({
        model: 'gemini-3-pro-preview', // Upgraded to Pro for better reasoning
        config: {
          systemInstruction: getSystemInstruction(template),
          temperature: 0.7,
          // Enable thinking for complex task breakdown
          thinkingConfig: { thinkingBudget: 1024 }, 
        },
      });
      this.chatSessions.set(agentId, chat);
    }
    return this.chatSessions.get(agentId)!;
  }

  async sendCommand(
    agentId: string, 
    template: string, 
    command: string, 
    onChunk: (text: string) => void
  ): Promise<string | null> {
    const chat = this.getChat(agentId, template);
    
    try {
      const result = await chat.sendMessageStream({ message: command });
      let fullText = "";
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || "";
        fullText += text;
        onChunk(text);
      }
      
      // Check for Approval Request in the full text
      const match = fullText.match(/\[\[APPROVAL_REQUIRED: (.*?)\]\]/);
      if (match) {
        return match[1]; // Return the description of the action requiring approval
      }
      
      return null;
    } catch (error) {
      console.error("Gemini Error:", error);
      onChunk(`\n[SYSTEM ERROR]: Connection to agent process failed.\n`);
      return null;
    }
  }

  resetAgent(agentId: string) {
    this.chatSessions.delete(agentId);
  }
}

export const agentService = new AgentService();