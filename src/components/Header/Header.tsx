import React, { useState } from 'react';
import {
  Play,
  Square,
  Sun,
  Moon,
  Layout,
  PanelBottom,
  PanelRight,
  PanelLeft,
  BookOpen,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Code2,
  Terminal,
  FolderTree,
  ChevronDown,
} from 'lucide-react';
import {
  TerminalPosition,
  ExplorerPosition,
  ThemeMode,
  ExecutionStatus,
  ExampleSnippet,
} from '../../types';
import { EXAMPLE_TEMPLATES } from '../../services/defaultFiles';

interface HeaderProps {
  onRun: () => void;
  onStop: () => void;
  executionStatus: ExecutionStatus;
  theme: ThemeMode;
  onToggleTheme: () => void;
  terminalPos: TerminalPosition;
  onChangeTerminalPos: (pos: TerminalPosition) => void;
  explorerPos: ExplorerPosition;
  onChangeExplorerPos: (pos: ExplorerPosition) => void;
  onLoadExample: (template: ExampleSnippet) => void;
  onResetWorkspace: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onStop,
  executionStatus,
  theme,
  onToggleTheme,
  terminalPos,
  onChangeTerminalPos,
  explorerPos,
  onChangeExplorerPos,
  onLoadExample,
  onResetWorkspace,
}) => {
  const [showExamples, setShowExamples] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const isDark = theme === 'dark';
  const isRunning = executionStatus === 'running' || executionStatus === 'waiting_input';

  return (
    <header
      id="main-ide-header"
      className={`h-12 px-4 border-b flex items-center justify-between select-none z-30 shrink-0 ${
        isDark
          ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
          : 'bg-white border-zinc-300 text-zinc-900 shadow-xs'
      }`}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md">
            <span className="text-base leading-none">🐍</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none tracking-tight flex items-center gap-1.5">
              Python IDE
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Pyodide 3.12
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Examples & Templates */}
      <div className="relative hidden lg:flex items-center">
        <button
          id="btn-examples-dropdown"
          onClick={() => setShowExamples(!showExamples)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
              : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800'
          }`}
        >
          <BookOpen size={14} className="text-amber-400" />
          <span>Python Examples</span>
          <ChevronDown size={13} className="opacity-60" />
        </button>

        {showExamples && (
          <div
            id="examples-menu"
            className={`absolute top-full left-0 mt-1 w-72 p-2 rounded-lg shadow-2xl border z-40 text-xs backdrop-blur-md ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-white border-zinc-300 text-zinc-900'
            }`}
          >
            <div className="font-semibold px-2 py-1 text-zinc-400 uppercase tracking-wider text-[10px]">
              Ready-to-run Templates
            </div>
            {EXAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                id={`example-${tmpl.id}`}
                onClick={() => {
                  onLoadExample(tmpl);
                  setShowExamples(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex flex-col gap-0.5 ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-amber-400">{tmpl.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {tmpl.category}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 leading-tight">
                  {tmpl.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Layout Manager, Theme Switcher, Reset Workspace */}
      <div className="flex items-center gap-2">
        {/* Layout Switcher Dropdown */}
        <div className="relative">
          <button
            id="btn-layout-menu"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            title="Change panel positions"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            <Layout size={14} />
            <span className="hidden sm:inline">Panels</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>

          {showLayoutMenu && (
            <div
              id="layout-menu"
              className={`absolute right-0 top-full mt-1 w-64 p-3 rounded-lg shadow-2xl border z-40 text-xs backdrop-blur-md ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            >
              <div className="font-semibold text-xs pb-1 mb-2 border-b border-zinc-700/50">
                Workspace Panels Position
              </div>

              {/* Terminal Position */}
              <div className="mb-3">
                <div className="text-[11px] text-zinc-400 mb-1.5 font-medium flex items-center gap-1">
                  <Terminal size={12} />
                  <span>Terminal Position</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    id="btn-terminal-pos-bottom"
                    onClick={() => onChangeTerminalPos('bottom')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      terminalPos === 'bottom'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <PanelBottom size={14} />
                    <span>Bottom</span>
                  </button>

                  <button
                    id="btn-terminal-pos-right"
                    onClick={() => onChangeTerminalPos('right')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      terminalPos === 'right'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <PanelRight size={14} />
                    <span>Right</span>
                  </button>

                  <button
                    id="btn-terminal-pos-left"
                    onClick={() => onChangeTerminalPos('left')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      terminalPos === 'left'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <PanelLeft size={14} />
                    <span>Left</span>
                  </button>
                </div>
              </div>

              {/* File Explorer Position */}
              <div>
                <div className="text-[11px] text-zinc-400 mb-1.5 font-medium flex items-center gap-1">
                  <FolderTree size={12} />
                  <span>File Explorer Position</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    id="btn-explorer-pos-left"
                    onClick={() => onChangeExplorerPos('left')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      explorerPos === 'left'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <PanelLeft size={14} />
                    <span>Left</span>
                  </button>

                  <button
                    id="btn-explorer-pos-right"
                    onClick={() => onChangeExplorerPos('right')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      explorerPos === 'right'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <PanelRight size={14} />
                    <span>Right</span>
                  </button>

                  <button
                    id="btn-explorer-pos-hidden"
                    onClick={() => onChangeExplorerPos(explorerPos === 'hidden' ? 'left' : 'hidden')}
                    className={`px-2 py-1.5 rounded flex flex-col items-center gap-1 text-[11px] border ${
                      explorerPos === 'hidden'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                        : isDark
                        ? 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span>Hide</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset Workspace */}
        <button
          id="btn-reset-workspace"
          onClick={() => {
            if (window.confirm('Reset all files to default examples?')) {
              onResetWorkspace();
            }
          }}
          title="Reset workspace to default files"
          className={`p-2 rounded-md text-xs border transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-600'
          }`}
        >
          <RotateCcw size={14} />
        </button>

        {/* Theme Mode Toggle (Dark / Light) */}
        <button
          id="btn-theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-amber-400'
              : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-blue-600'
          }`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </button>

        <div className="h-5 w-[1px] bg-zinc-700/50 mx-1 hidden sm:block" />

        {/* The ONLY Run / Stop button at the far right corner */}
        <div className="flex items-center gap-2">
          <button
            id="btn-main-run"
            onClick={onRun}
            disabled={isRunning}
            title="Execute Python Script (Ctrl+Enter)"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-xs transition-all shadow-md active:scale-95 ${
              isRunning
                ? 'bg-amber-600 text-white cursor-wait opacity-90'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:shadow-emerald-900/60'
            }`}
          >
            <Play size={14} className={isRunning ? 'animate-spin' : 'fill-white'} />
            <span className="tracking-wide">{isRunning ? 'Running...' : 'Run ▶'}</span>
            <span className="text-[10px] opacity-75 font-mono ml-0.5 hidden md:inline">Ctrl+↵</span>
          </button>

          {isRunning && (
            <button
              id="btn-main-stop"
              onClick={onStop}
              title="Stop execution (Kill process)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-md active:scale-95 animate-pulse"
            >
              <Square size={13} className="fill-white" />
              <span>Stop ■</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
