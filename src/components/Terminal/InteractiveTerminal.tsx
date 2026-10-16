import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, ExecutionStatus } from '../../types';
import {
  Terminal as TerminalIcon,
  Trash2,
  Square,
  Play,
  CornerDownLeft,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
  AlertCircle,
} from 'lucide-react';

interface InteractiveTerminalProps {
  lines: TerminalLine[];
  executionStatus: ExecutionStatus;
  statusMessage?: string;
  isWaitingInput: boolean;
  inputPrompt: string;
  onSubmitInput: (val: string) => void;
  onClear: () => void;
  onStop: () => void;
  onRunRepl: (cmd: string) => void;
  theme: 'dark' | 'light';
  fontSize?: number;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  lines,
  executionStatus,
  statusMessage,
  isWaitingInput,
  inputPrompt,
  onSubmitInput,
  onClear,
  onStop,
  onRunRepl,
  theme,
  fontSize = 13,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [replInput, setReplInput] = useState('');
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLInputElement>(null);
  const replInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const isRunning = executionStatus === 'running' || executionStatus === 'waiting_input';

  // Auto-scroll to bottom when lines change or when waiting for input
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines, isWaitingInput, inputPrompt]);

  // Focus active input when waiting for input
  useEffect(() => {
    if (isWaitingInput && activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [isWaitingInput]);

  // Handle submitting input for program's input()
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWaitingInput) return;

    const val = inputValue;
    setInputHistory((prev) => [...prev, val]);
    setHistoryIndex(-1);
    setInputValue('');
    onSubmitInput(val);
  };

  // Handle REPL command submission when program is not running
  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;

    const cmd = replInput.trim();
    if (!cmd) return;

    setInputHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setReplInput('');

    if (cmd.toLowerCase() === 'cls' || cmd.toLowerCase() === 'clear') {
      onClear();
      return;
    }

    onRunRepl(cmd);
  };

  // History cycling (Up/Down arrow)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setter(inputHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= inputHistory.length) {
          setHistoryIndex(-1);
          setter('');
        } else {
          setHistoryIndex(nextIdx);
          setter(inputHistory[nextIdx]);
        }
      }
    }
  };

  // Copy all terminal text
  const handleCopyTerminal = () => {
    const fullText = lines.map((l) => l.text).join('');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render styled line
  const renderLine = (line: TerminalLine) => {
    switch (line.type) {
      case 'stderr':
        return (
          <span key={line.id} className="text-red-400 font-mono whitespace-pre-wrap selection:bg-red-900/50">
            {line.text}
          </span>
        );
      case 'stdin':
        return (
          <span key={line.id} className="text-amber-300 font-mono whitespace-pre-wrap font-semibold">
            {line.text}
          </span>
        );
      case 'system':
      case 'info':
        return (
          <span key={line.id} className="text-zinc-500 font-mono whitespace-pre-wrap text-[11px] select-none italic">
            {line.text}
          </span>
        );
      case 'prompt':
        return (
          <span key={line.id} className="text-emerald-400 font-mono font-bold whitespace-pre-wrap">
            {line.text}
          </span>
        );
      case 'stdout':
      default:
        return (
          <span
            key={line.id}
            className={`font-mono whitespace-pre-wrap ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            {line.text}
          </span>
        );
    }
  };

  return (
    <div
      id="interactive-terminal-container"
      className={`flex flex-col h-full w-full overflow-hidden border ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'
      }`}
      onClick={() => {
        if (isWaitingInput && activeInputRef.current) {
          activeInputRef.current.focus();
        } else if (!isRunning && replInputRef.current) {
          replInputRef.current.focus();
        }
      }}
    >
      {/* Terminal Header Bar */}
      <div
        id="terminal-header"
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs select-none ${
          isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-emerald-500 shrink-0" />
          <span className="font-semibold font-mono text-xs">Terminal / Console</span>

          {/* Running / Waiting indicator */}
          {isRunning && (
            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {isWaitingInput ? 'Waiting for Input' : 'Executing'}
            </div>
          )}

          {executionStatus === 'success' && (
            <span className="text-[11px] text-emerald-500 font-mono ml-2 hidden sm:inline">
              ✓ Done (exit code 0)
            </span>
          )}

          {executionStatus === 'error' && (
            <span className="text-[11px] text-red-400 font-mono ml-2 hidden sm:inline">
              ✕ Process error
            </span>
          )}
        </div>

        {/* Terminal Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Stop Button */}
          {isRunning && (
            <button
              id="btn-terminal-stop"
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              title="Stop current execution (Kill process)"
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs active:scale-95"
            >
              <Square size={11} className="fill-white" />
              <span>Stop</span>
            </button>
          )}

          <button
            id="btn-clear-terminal"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Clear terminal output (Ctrl+L)"
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <Trash2 size={13} />
          </button>

          <button
            id="btn-copy-terminal"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyTerminal();
            }}
            title="Copy terminal contents"
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        id="terminal-body"
        ref={terminalBodyRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs leading-relaxed select-text cursor-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        {lines.length === 0 && !isWaitingInput && (
          <div className="text-zinc-500 text-xs italic py-2">
            Terminal ready. Click <span className="text-emerald-400 font-semibold font-mono">▶ Run</span> to execute your Python script, or type Python commands below.
          </div>
        )}

        {lines.map((line) => renderLine(line))}

        {/* Interactive input() prompt row */}
        {isWaitingInput && (
          <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5 mt-1 bg-amber-500/10 p-1.5 rounded border border-amber-500/30">
            <span className="text-amber-400 font-bold font-mono shrink-0">
              {inputPrompt || 'input >'}
            </span>
            <input
              id="terminal-interactive-input"
              ref={activeInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, setInputValue)}
              placeholder="Type your answer and press Enter..."
              autoFocus
              className="flex-1 bg-transparent text-amber-200 font-mono text-xs outline-none border-none caret-amber-400 placeholder:text-amber-400/40"
            />
            <button
              id="btn-submit-input"
              type="submit"
              title="Submit input (Enter)"
              className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold text-[11px] hover:bg-amber-400 flex items-center gap-1"
            >
              <span>Send</span>
              <CornerDownLeft size={11} />
            </button>
          </form>
        )}

        {/* Python REPL prompt when idle */}
        {!isRunning && (
          <form onSubmit={handleReplSubmit} className="flex items-center gap-1.5 mt-2 opacity-85 hover:opacity-100 transition-opacity">
            <span className="text-emerald-500 font-bold font-mono text-xs shrink-0 select-none">
              &gt;&gt;&gt;
            </span>
            <input
              id="terminal-repl-input"
              ref={replInputRef}
              type="text"
              value={replInput}
              onChange={(e) => setReplInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, setReplInput)}
              placeholder="Type Python expression or statement (e.g. 2 + 2, len([1, 2, 3]))..."
              className={`flex-1 bg-transparent font-mono text-xs outline-none border-none placeholder:text-zinc-500 ${
                isDark ? 'text-zinc-100 caret-emerald-400' : 'text-zinc-900 caret-blue-600'
              }`}
            />
            {replInput && (
              <button
                type="submit"
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-0.5"
              >
                <span>Run</span>
                <CornerDownLeft size={10} />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Terminal Footer Status Bar */}
      <div
        className={`px-3 py-1 text-[11px] border-t flex items-center justify-between select-none ${
          isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500' : 'bg-zinc-100 border-zinc-300 text-zinc-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Python 3.12 (Pyodide Wasm)</span>
          {statusMessage && <span className="truncate max-w-xs">• {statusMessage}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>Interactive Stdin: Enabled</span>
          <span className="hidden sm:inline">Lines: {lines.length}</span>
        </div>
      </div>
    </div>
  );
};
