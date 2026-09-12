import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { logService, LogEntry, LogLevel, LogSource } from '../../services/logService';
import {
  Terminal,
  X,
  Trash2,
  Copy,
  Check,
  ArrowDown,
  Filter,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const TerminalDrawer: React.FC = () => {
  const { isTerminalOpen, setIsTerminalOpen, settings, t } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterSource, setFilterSource] = useState<'ALL' | 'BACKEND' | 'FRONTEND' | 'ERRORS'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time log events
  useEffect(() => {
    const unsubscribe = logService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  // Connect to backend stream when backend is online or configured
  useEffect(() => {
    if (settings.backendUrl) {
      logService.connectToBackend(settings.backendUrl);
    }
    return () => {
      logService.disconnect();
    };
  }, [settings.backendUrl]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen, setIsTerminalOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Source / Error filter
      if (filterSource === 'BACKEND' && log.source !== 'BACKEND') return false;
      if (filterSource === 'FRONTEND' && log.source !== 'FRONTEND' && log.source !== 'GEMINI' && log.source !== 'OPENROUTER' && log.source !== 'STAGE') return false;
      if (filterSource === 'ERRORS' && log.level !== 'ERROR' && log.level !== 'WARN') return false;

      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          log.source.toLowerCase().includes(q) ||
          log.level.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [logs, filterSource, searchQuery]);

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}]: ${l.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getLevelClass = (level: LogLevel): string => {
    switch (level) {
      case 'ERROR':
        return 'log-badge-error';
      case 'WARN':
        return 'log-badge-warn';
      case 'SUCCESS':
        return 'log-badge-success';
      default:
        return 'log-badge-info';
    }
  };

  const getSourceClass = (source: LogSource): string => {
    switch (source) {
      case 'BACKEND':
        return 'source-backend';
      case 'GEMINI':
        return 'source-gemini';
      case 'OPENROUTER':
        return 'source-openrouter';
      case 'STAGE':
        return 'source-stage';
      case 'SYSTEM':
        return 'source-system';
      default:
        return 'source-frontend';
    }
  };

  if (!isTerminalOpen) return null;

  return (
    <div className="terminal-overlay" onClick={() => setIsTerminalOpen(false)}>
      <div className="terminal-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-header-title">
            <Terminal size={18} className="terminal-title-icon" />
            <span className="terminal-title-text">{t('terminalTitle')}</span>
            <div className="terminal-status-pills">
              <span className={`status-pill ${settings.isBackendConnected ? 'online' : 'offline'}`}>
                {settings.isBackendConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {settings.isBackendConnected ? 'FastAPI Backend (8000)' : 'Backend Offline'}
              </span>
              <span className="status-pill model">
                <Cpu size={12} />
                {settings.apiProvider === 'gemini'
                  ? (settings.geminiModel || 'Gemini 3.6 Flash')
                  : settings.apiProvider === 'openrouter'
                  ? (settings.openRouterModel || 'openrouter/free')
                  : settings.apiProvider === 'hybrid'
                  ? '⚡ Auto-Fallback (Gemini + OpenRouter)'
                  : (settings.ollamaModel || 'Procedural')}
              </span>
            </div>
          </div>

          <button
            className="terminal-close-btn"
            onClick={() => setIsTerminalOpen(false)}
            title={t('terminalCloseEsc')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="terminal-toolbar">
          <div className="terminal-filter-group">
            <button
              className={`term-filter-btn ${filterSource === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterSource('ALL')}
            >
              {t('terminalFilterAll')} ({logs.length})
            </button>
            <button
              className={`term-filter-btn ${filterSource === 'BACKEND' ? 'active' : ''}`}
              onClick={() => setFilterSource('BACKEND')}
            >
              {t('terminalFilterBackend')}
            </button>
            <button
              className={`term-filter-btn ${filterSource === 'FRONTEND' ? 'active' : ''}`}
              onClick={() => setFilterSource('FRONTEND')}
            >
              {t('terminalFilterFrontend')}
            </button>
            <button
              className={`term-filter-btn errors ${filterSource === 'ERRORS' ? 'active' : ''}`}
              onClick={() => setFilterSource('ERRORS')}
            >
              {t('terminalFilterErrors')}
            </button>
          </div>

          <div className="terminal-search-box">
            <input
              type="text"
              className="terminal-search-input"
              placeholder={t('terminalFilterLogsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="terminal-actions">
            <button
              className={`term-action-btn ${autoScroll ? 'active' : ''}`}
              onClick={() => setAutoScroll((prev) => !prev)}
              title={t('terminalAutoScrollTooltip')}
            >
              <ArrowDown size={14} />
              <span>Auto-scroll</span>
            </button>

            <button
              className="term-action-btn"
              onClick={handleCopyLogs}
              title={t('terminalCopy')}
            >
              {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
              <span>{copied ? t('terminalCopied') : t('terminalCopy')}</span>
            </button>

            <button
              className="term-action-btn danger"
              onClick={() => logService.clear()}
              title={t('terminalClear')}
            >
              <Trash2 size={14} />
              <span>{t('terminalClear')}</span>
            </button>
          </div>
        </div>

        {/* Console Stream Area */}
        <div className="terminal-body" ref={logContainerRef}>
          {filteredLogs.length === 0 ? (
            <div className="terminal-empty">
              <Activity size={24} style={{ opacity: 0.4 }} />
              <p>{t('terminalNoLogs')}</p>
            </div>
          ) : (
            <div className="terminal-log-list">
              {filteredLogs.map((item) => (
                <div key={item.id} className={`terminal-log-row ${item.level.toLowerCase()}`}>
                  <span className="log-time">{item.timestamp}</span>
                  <span className={`log-badge ${getLevelClass(item.level)}`}>
                    {item.level}
                  </span>
                  <span className={`log-source ${getSourceClass(item.source)}`}>
                    [{item.source}]
                  </span>
                  <span className="log-message">{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
