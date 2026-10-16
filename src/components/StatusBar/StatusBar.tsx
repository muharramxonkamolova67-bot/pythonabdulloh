import React from 'react';
import { ExecutionStatus, ThemeMode } from '../../types';
import { Terminal, ShieldCheck, Cpu, Code2 } from 'lucide-react';

interface StatusBarProps {
  executionStatus: ExecutionStatus;
  statusMessage?: string;
  theme: ThemeMode;
  activeFileName?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  executionStatus,
  statusMessage,
  theme,
  activeFileName = 'main.py',
}) => {
  const isDark = theme === 'dark';

  return (
    <footer
      id="ide-status-bar"
      className={`h-6 px-3 border-t flex items-center justify-between text-[11px] font-mono select-none z-20 shrink-0 ${
        isDark
          ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
          : 'bg-zinc-100 border-zinc-300 text-zinc-600'
      }`}
    >
      {/* Left items */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              executionStatus === 'running' || executionStatus === 'waiting_input'
                ? 'bg-amber-400 animate-ping'
                : executionStatus === 'error'
                ? 'bg-red-500'
                : executionStatus === 'success'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
          />
          <span className="font-semibold text-zinc-300">
            {executionStatus === 'waiting_input'
              ? 'Waiting for Terminal Input'
              : executionStatus === 'running'
              ? 'Executing...'
              : executionStatus === 'error'
              ? 'Execution Error'
              : 'Python Ready'}
          </span>
        </div>

        {statusMessage && (
          <span className="hidden md:inline truncate max-w-sm text-zinc-400">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 text-zinc-400 text-[10px]">
          <span>Run: <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">Ctrl+Enter</kbd></span>
          <span>Format: <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">Shift+Alt+F</kbd></span>
        </div>

        <span className="hidden sm:inline">Spaces: 4</span>
        <span className="hidden sm:inline">UTF-8</span>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <span>Python 3.12</span>
        </div>
      </div>
    </footer>
  );
};
