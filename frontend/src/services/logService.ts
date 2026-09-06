export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogSource = 'BACKEND' | 'FRONTEND' | 'GEMINI' | 'STAGE' | 'SYSTEM';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
}

type LogListener = (logs: LogEntry[]) => void;

class LogService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private eventSource: EventSource | null = null;
  private maxLogs = 350;
  private backendConnected = false;

  constructor() {
    this.addLog('INFO', 'SYSTEM', 'Terminal de depuração inicializado.');
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public addLog(level: LogLevel, source: LogSource, message: string): void {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      level,
      source,
      message,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.notify();
  }

  public clear(): void {
    this.logs = [];
    this.addLog('INFO', 'SYSTEM', 'Logs limpos pelo usuário.');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getLogs();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  /**
   * Conecta ao stream SSE de logs do backend FastAPI se disponível
   */
  public connectToBackend(backendUrl: string = 'http://localhost:8000'): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (!backendUrl) return;

    try {
      const streamUrl = `${backendUrl}/api/logs/stream`;
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.backendConnected = true;
        this.addLog('SUCCESS', 'BACKEND', `Stream de logs conectado com sucesso via SSE em ${backendUrl}`);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.message) {
            this.addLog(
              (data.level || 'INFO') as LogLevel,
              (data.source || 'BACKEND') as LogSource,
              data.message
            );
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.eventSource.onerror = () => {
        if (this.backendConnected) {
          this.addLog('WARN', 'BACKEND', 'Conexão com stream de logs do backend interrompida.');
          this.backendConnected = false;
        }
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      };
    } catch (e) {
      console.warn('Could not establish backend log SSE connection:', e);
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.backendConnected = false;
    }
  }
}

export const logService = new LogService();
