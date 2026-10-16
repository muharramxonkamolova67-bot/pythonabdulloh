import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Replace, ReplaceAll } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean, isNext: boolean) => number; // returns match count
  onReplace: (query: string, replacement: string, all: boolean) => void;
  theme: 'dark' | 'light';
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query) {
      const count = onFind(query, matchCase, true);
      setMatchCount(count);
    } else {
      setMatchCount(0);
    }
  }, [query, matchCase]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div
      id="find-replace-bar"
      className={`absolute top-2 right-6 z-20 flex flex-col gap-1.5 p-2 rounded-lg border shadow-xl text-xs backdrop-blur-md transition-all ${
        isDark
          ? 'bg-zinc-900/95 border-zinc-700/80 text-zinc-100'
          : 'bg-white/95 border-zinc-300 text-zinc-800'
      }`}
    >
      {/* Find Row */}
      <div className="flex items-center gap-1.5">
        <div
          className={`flex items-center px-2 py-1 rounded border ${
            isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
          }`}
        >
          <Search size={14} className="opacity-50 mr-1.5 shrink-0" />
          <input
            id="find-input"
            ref={searchInputRef}
            type="text"
            placeholder="Find (Ctrl+F)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onFind(query, matchCase, !e.shiftKey);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            className="bg-transparent border-none outline-none w-36 font-mono text-xs"
          />
          {query && (
            <span className="text-[10px] text-zinc-400 font-mono ml-1 shrink-0">
              {matchCount} match{matchCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        <button
          id="btn-match-case"
          title="Match Case (Alt+C)"
          onClick={() => setMatchCase(!matchCase)}
          className={`px-1.5 py-1 rounded font-bold transition-colors ${
            matchCase
              ? 'bg-blue-600 text-white'
              : isDark
              ? 'hover:bg-zinc-800 text-zinc-400'
              : 'hover:bg-zinc-200 text-zinc-600'
          }`}
        >
          Aa
        </button>

        <button
          id="btn-find-prev"
          title="Previous Match (Shift+Enter)"
          onClick={() => onFind(query, matchCase, false)}
          className={`p-1 rounded ${
            isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <ChevronUp size={14} />
        </button>

        <button
          id="btn-find-next"
          title="Next Match (Enter)"
          onClick={() => onFind(query, matchCase, true)}
          className={`p-1 rounded ${
            isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <ChevronDown size={14} />
        </button>

        <button
          id="btn-toggle-replace"
          title="Toggle Replace Mode"
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded ${
            showReplace
              ? 'bg-blue-500/20 text-blue-400'
              : isDark
              ? 'hover:bg-zinc-800 text-zinc-400'
              : 'hover:bg-zinc-200 text-zinc-600'
          }`}
        >
          <Replace size={14} />
        </button>

        <button
          id="btn-close-find"
          title="Close (Esc)"
          onClick={onClose}
          className={`p-1 rounded ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-700/40">
          <div
            className={`flex items-center px-2 py-1 rounded border ${
              isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
            }`}
          >
            <input
              id="replace-input"
              type="text"
              placeholder="Replace with..."
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onReplace(query, replacement, false);
                }
              }}
              className="bg-transparent border-none outline-none w-36 font-mono text-xs"
            />
          </div>

          <button
            id="btn-replace-one"
            title="Replace Next"
            onClick={() => onReplace(query, replacement, false)}
            disabled={!query}
            className={`px-2 py-1 rounded flex items-center gap-1 ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 disabled:opacity-40'
            }`}
          >
            <Replace size={12} />
            Replace
          </button>

          <button
            id="btn-replace-all"
            title="Replace All"
            onClick={() => onReplace(query, replacement, true)}
            disabled={!query}
            className={`px-2 py-1 rounded flex items-center gap-1 ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 disabled:opacity-40'
            }`}
          >
            <ReplaceAll size={12} />
            All
          </button>
        </div>
      )}
    </div>
  );
};
