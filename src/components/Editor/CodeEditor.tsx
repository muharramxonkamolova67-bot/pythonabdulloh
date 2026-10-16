import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { tokenizePython, Token } from '../../services/pythonLexer';
import { formatPythonCode } from '../../services/pythonFormatter';
import { FindReplaceBar } from './FindReplaceBar';
import { EditorTabs } from './EditorTabs';
import { TabItem, FileItem, EditorSettings } from '../../types';
import {
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Copy,
  Check,
  Code2,
  FileCode,
  Settings2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CodeEditorProps {
  files: FileItem[];
  activeFileId: string | null;
  tabs: TabItem[];
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onNewFile: () => void;
  onUpdateContent: (fileId: string, content: string) => void;
  onRun: () => void;
  isRunning: boolean;
  theme: 'dark' | 'light';
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  tabs,
  onSelectTab,
  onCloseTab,
  onNewFile,
  onUpdateContent,
  onRun,
  isRunning,
  theme,
  settings,
  onUpdateSettings,
}) => {
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const code = activeFile ? activeFile.content : '';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, index: 0 });
  const [copied, setCopied] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const isDark = theme === 'dark';

  // Synchronize scroll between textarea, syntax highlight pre, and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  }, []);

  // Update cursor position line & col
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const index = textareaRef.current.selectionStart;
    const textBefore = code.slice(0, index);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col, index });
  }, [code]);

  // Tokenize code for syntax highlighting
  const tokens = useMemo(() => tokenizePython(code), [code]);

  // Line count
  const lines = useMemo(() => code.split('\n'), [code]);
  const lineCount = Math.max(1, lines.length);

  // Format code handler
  const handleFormat = useCallback(() => {
    if (!activeFile) return;
    const formatted = formatPythonCode(code, settings.tabSize);
    onUpdateContent(activeFile.id, formatted);
  }, [activeFile, code, onUpdateContent, settings.tabSize]);

  // Copy code handler
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Find & Replace helper
  const handleFind = useCallback(
    (query: string, matchCase: boolean, isNext: boolean): number => {
      if (!query || !textareaRef.current) return 0;
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = Array.from(code.matchAll(regex)) as RegExpExecArray[];

      if (matches.length === 0) return 0;

      const currentIdx = textareaRef.current.selectionStart;
      let targetMatch: RegExpExecArray | undefined;

      if (isNext) {
        targetMatch = matches.find((m) => m.index !== undefined && m.index > currentIdx) || matches[0];
      } else {
        const prevMatches = matches.filter((m) => m.index !== undefined && m.index < currentIdx);
        targetMatch = prevMatches.length > 0 ? prevMatches[prevMatches.length - 1] : matches[matches.length - 1];
      }

      if (targetMatch && targetMatch.index !== undefined) {
        textareaRef.current.setSelectionRange(targetMatch.index, targetMatch.index + query.length);
        textareaRef.current.focus();
        updateCursorPosition();
      }

      return matches.length;
    },
    [code, updateCursorPosition]
  );

  const handleReplace = useCallback(
    (query: string, replacement: string, all: boolean) => {
      if (!query || !activeFile) return;
      if (all) {
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const newCode = code.replace(regex, replacement);
        onUpdateContent(activeFile.id, newCode);
      } else {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = code.slice(start, end);

        if (selectedText === query) {
          const newCode = code.slice(0, start) + replacement + code.slice(end);
          onUpdateContent(activeFile.id, newCode);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(start + replacement.length, start + replacement.length);
              handleFind(query, false, true);
            }
          }, 0);
        } else {
          handleFind(query, false, true);
        }
      }
    },
    [activeFile, code, handleFind, onUpdateContent]
  );

  // KeyDown interceptor for smart indentation, auto-closing quotes/brackets, print snippet
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeFile) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const isSelection = start !== end;
    const prevChar = start > 0 ? code[start - 1] : '';
    const nextChar = end < code.length ? code[end] : '';

    // Shortcuts: Ctrl+Enter / Cmd+Enter => Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // Shortcut: Ctrl+F / Cmd+F => Find
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // Shortcut: Shift+Alt+F or Ctrl+Shift+F => Format
    if ((e.altKey && e.shiftKey && (e.key === 'f' || e.key === 'F')) || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'f' || e.key === 'F'))) {
      e.preventDefault();
      handleFormat();
      return;
    }

    // 1. Tab / Shift+Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabSpaces = ' '.repeat(settings.tabSize);

      if (!isSelection) {
        // Insert spaces at cursor
        const newCode = code.slice(0, start) + tabSpaces + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start + settings.tabSize, start + settings.tabSize);
          updateCursorPosition();
        }, 0);
      } else {
        // Indent / Unindent selected block
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;
        const lineEndIdx = code.indexOf('\n', end);
        const blockEnd = lineEndIdx === -1 ? code.length : lineEndIdx;
        const block = code.slice(lineStart, blockEnd);
        const blockLines = block.split('\n');

        let modified: string[];
        if (e.shiftKey) {
          // Unindent
          modified = blockLines.map((l) => (l.startsWith(tabSpaces) ? l.slice(settings.tabSize) : l.replace(/^\s{1,3}/, '')));
        } else {
          // Indent
          modified = blockLines.map((l) => tabSpaces + l);
        }

        const newBlock = modified.join('\n');
        const newCode = code.slice(0, lineStart) + newBlock + code.slice(blockEnd);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(lineStart, lineStart + newBlock.length);
          updateCursorPosition();
        }, 0);
      }
      return;
    }

    // 2. Auto-Closing quotes with selection wrapping & skip-over
    if (settings.autoCloseQuotes && (e.key === "'" || e.key === '"')) {
      const quote = e.key;

      if (isSelection) {
        e.preventDefault();
        const selected = code.slice(start, end);
        const wrapped = `${quote}${selected}${quote}`;
        const newCode = code.slice(0, start) + wrapped + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, end + 1);
          updateCursorPosition();
        }, 0);
        return;
      }

      // Skip over closing quote if typed before matching quote
      if (nextChar === quote) {
        e.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorPosition();
        return;
      }

      // Auto-insert pair: '' or ""
      e.preventDefault();
      const newCode = code.slice(0, start) + `${quote}${quote}` + code.slice(end);
      onUpdateContent(activeFile.id, newCode);
      setTimeout(() => {
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorPosition();
      }, 0);
      return;
    }

    // 3. Auto-Closing Brackets: (), [], {}
    if (settings.autoCloseBrackets && (e.key === '(' || e.key === '[' || e.key === '{')) {
      const openChar = e.key;
      const closeChar = openChar === '(' ? ')' : openChar === '[' ? ']' : '}';

      if (isSelection) {
        e.preventDefault();
        const selected = code.slice(start, end);
        const wrapped = `${openChar}${selected}${closeChar}`;
        const newCode = code.slice(0, start) + wrapped + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, end + 1);
          updateCursorPosition();
        }, 0);
        return;
      }

      e.preventDefault();
      const newCode = code.slice(0, start) + `${openChar}${closeChar}` + code.slice(end);
      onUpdateContent(activeFile.id, newCode);
      setTimeout(() => {
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorPosition();
      }, 0);
      return;
    }

    // 4. Skip-over Closing Characters: ), ], }
    if (settings.autoCloseBrackets && (e.key === ')' || e.key === ']' || e.key === '}')) {
      if (nextChar === e.key) {
        e.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorPosition();
        return;
      }
    }

    // 5. Smart 'print' trigger
    // "When I type `print`, automatically insert `print()` and place the cursor inside the parentheses."
    if (settings.autoInsertPrint && e.key === 't') {
      // Check if preceding 4 chars are 'prin'
      const preceding = code.slice(Math.max(0, start - 4), start);
      if (preceding === 'prin' && (start === 4 || /[\s(\[:=+\-*/%]/.test(code[start - 5]))) {
        e.preventDefault();
        // Insert 't()' and place cursor inside parentheses
        const newCode = code.slice(0, start) + 't()' + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2); // between '(' and ')'
          updateCursorPosition();
        }, 0);
        return;
      }
    }

    // 6. Enter key with smart indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const currentLine = code.slice(lineStart, start);
      const matchIndent = currentLine.match(/^\s*/);
      let indent = matchIndent ? matchIndent[0] : '';

      // If line ends with ':' add 4 extra spaces
      const trimmedBeforeCursor = currentLine.trimEnd();
      if (trimmedBeforeCursor.endsWith(':')) {
        indent += ' '.repeat(settings.tabSize);
      }

      // Check if cursor is between matched pairs: () or [] or {}
      if (
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '{' && nextChar === '}')
      ) {
        const extraIndent = indent + ' '.repeat(settings.tabSize);
        const insertion = `\n${extraIndent}\n${indent}`;
        const newCode = code.slice(0, start) + insertion + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start + 1 + extraIndent.length, start + 1 + extraIndent.length);
          updateCursorPosition();
        }, 0);
        return;
      }

      const insertion = `\n${indent}`;
      const newCode = code.slice(0, start) + insertion + code.slice(end);
      onUpdateContent(activeFile.id, newCode);
      setTimeout(() => {
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
        updateCursorPosition();
      }, 0);
      return;
    }

    // 7. Backspace smart delete inside empty pairs: '', "", (), [], {}
    if (e.key === 'Backspace' && !isSelection) {
      if (
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === "'" && nextChar === "'") ||
        (prevChar === '"' && nextChar === '"')
      ) {
        e.preventDefault();
        const newCode = code.slice(0, start - 1) + code.slice(end + 1);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start - 1, start - 1);
          updateCursorPosition();
        }, 0);
        return;
      }

      // Smart 4-space backspace
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const textFromLineStart = code.slice(lineStart, start);
      if (textFromLineStart.length > 0 && /^ +$/.test(textFromLineStart) && textFromLineStart.length % settings.tabSize === 0) {
        e.preventDefault();
        const deleteCount = settings.tabSize;
        const newCode = code.slice(0, start - deleteCount) + code.slice(end);
        onUpdateContent(activeFile.id, newCode);
        setTimeout(() => {
          textarea.setSelectionRange(start - deleteCount, start - deleteCount);
          updateCursorPosition();
        }, 0);
        return;
      }
    }
  };

  // Helper to color token spans
  const renderToken = (token: Token, idx: number) => {
    switch (token.type) {
      case 'keyword':
        return (
          <span key={idx} className={isDark ? 'text-purple-400 font-semibold' : 'text-purple-700 font-semibold'}>
            {token.value}
          </span>
        );
      case 'builtin':
        return (
          <span key={idx} className={isDark ? 'text-cyan-400 font-medium' : 'text-cyan-700 font-medium'}>
            {token.value}
          </span>
        );
      case 'constant':
        return (
          <span key={idx} className={isDark ? 'text-amber-400 font-semibold' : 'text-amber-700 font-semibold'}>
            {token.value}
          </span>
        );
      case 'function_def':
        return (
          <span key={idx} className={isDark ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold'}>
            {token.value}
          </span>
        );
      case 'class_def':
        return (
          <span key={idx} className={isDark ? 'text-yellow-300 font-bold' : 'text-amber-600 font-bold'}>
            {token.value}
          </span>
        );
      case 'function_call':
        return (
          <span key={idx} className={isDark ? 'text-sky-300' : 'text-blue-700'}>
            {token.value}
          </span>
        );
      case 'string':
        return (
          <span key={idx} className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
            {token.value}
          </span>
        );
      case 'comment':
        return (
          <span key={idx} className={isDark ? 'text-zinc-500 italic' : 'text-zinc-500 italic'}>
            {token.value}
          </span>
        );
      case 'number':
        return (
          <span key={idx} className={isDark ? 'text-orange-400' : 'text-orange-600'}>
            {token.value}
          </span>
        );
      case 'decorator':
        return (
          <span key={idx} className={isDark ? 'text-yellow-400 font-medium' : 'text-amber-600 font-medium'}>
            {token.value}
          </span>
        );
      case 'operator':
        return (
          <span key={idx} className={isDark ? 'text-pink-400' : 'text-pink-600'}>
            {token.value}
          </span>
        );
      case 'punctuation':
        return (
          <span key={idx} className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
            {token.value}
          </span>
        );
      default:
        return <span key={idx}>{token.value}</span>;
    }
  };

  return (
    <div
      id="code-editor-container"
      className={`relative flex flex-col h-full w-full overflow-hidden border ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
      }`}
    >
      {/* File Tabs Bar */}
      <EditorTabs
        tabs={tabs}
        activeFileId={activeFileId}
        files={files}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewFile={onNewFile}
        isSaved={isSaved}
        theme={theme}
      />

      {/* Editor Action Toolbar */}
      <div
        id="editor-toolbar"
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs select-none ${
          isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            id="btn-format-code"
            onClick={handleFormat}
            title="Format Python code (Shift+Alt+F)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100' : 'hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <Sparkles size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Format</span>
          </button>

          <button
            id="btn-find-replace"
            onClick={() => setShowFind(!showFind)}
            title="Find & Replace (Ctrl+F)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              showFind
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'hover:bg-zinc-800 text-zinc-300'
                : 'hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <Search size={13} />
            <span className="hidden sm:inline">Find</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            title="Copy code to clipboard"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Quick Settings dropdown */}
          <div className="relative">
            <button
              id="btn-editor-settings"
              onClick={() => setShowSettings(!showSettings)}
              title="Editor options"
              className={`p-1 rounded transition-colors ${
                showSettings
                  ? 'bg-zinc-700 text-white'
                  : isDark
                  ? 'hover:bg-zinc-800 text-zinc-400'
                  : 'hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              <Settings2 size={14} />
            </button>

            {showSettings && (
              <div
                id="editor-settings-menu"
                className={`absolute right-0 top-full mt-1 w-56 p-2 rounded-lg shadow-xl border z-30 text-xs backdrop-blur-md ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                <div className="font-semibold text-xs pb-1 mb-1 border-b border-zinc-700/50">
                  Editor Settings
                </div>

                <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-zinc-800/40 px-1 rounded">
                  <span>Auto-close quotes (", ')</span>
                  <input
                    type="checkbox"
                    checked={settings.autoCloseQuotes}
                    onChange={(e) => onUpdateSettings({ autoCloseQuotes: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-zinc-800/40 px-1 rounded">
                  <span>Auto-close brackets ((), [], {})</span>
                  <input
                    type="checkbox"
                    checked={settings.autoCloseBrackets}
                    onChange={(e) => onUpdateSettings({ autoCloseBrackets: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-zinc-800/40 px-1 rounded">
                  <span>Auto-insert print() snippet</span>
                  <input
                    type="checkbox"
                    checked={settings.autoInsertPrint}
                    onChange={(e) => onUpdateSettings({ autoInsertPrint: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-zinc-800/40 px-1 rounded">
                  <span>Line numbers</span>
                  <input
                    type="checkbox"
                    checked={settings.lineNumbers}
                    onChange={(e) => onUpdateSettings({ lineNumbers: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                </label>

                <div className="flex items-center justify-between py-1 px-1">
                  <span>Font size</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateSettings({ fontSize: Math.max(11, settings.fontSize - 1) })}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs">{settings.fontSize}px</span>
                    <button
                      onClick={() => onUpdateSettings({ fontSize: Math.min(22, settings.fontSize + 1) })}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Find and Replace floating bar */}
      <FindReplaceBar
        isOpen={showFind}
        onClose={() => setShowFind(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        theme={theme}
      />

      {/* Editor Body */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Line Numbers Bar */}
        {settings.lineNumbers && (
          <div
            id="editor-line-numbers"
            ref={lineNumbersRef}
            aria-hidden="true"
            className={`shrink-0 select-none text-right font-mono pr-3 pl-2 pt-3 pb-12 overflow-hidden border-r ${
              isDark
                ? 'bg-zinc-950/70 border-zinc-800 text-zinc-600'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: '1.6',
              minWidth: `${Math.max(38, String(lineCount).length * 10 + 20)}px`,
            }}
          >
            {Array.from({ length: lineCount }, (_, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = lineNum === cursorPos.line;
              return (
                <div
                  key={lineNum}
                  className={`transition-colors ${
                    isCurrentLine ? (isDark ? 'text-amber-400 font-bold' : 'text-blue-600 font-bold') : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Textarea + Syntax Highlight Layer */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Active Line Highlight Background */}
          <div
            aria-hidden="true"
            className={`absolute left-0 right-0 pointer-events-none transition-all ${
              isDark ? 'bg-zinc-900/60' : 'bg-blue-50/70'
            }`}
            style={{
              top: `${(cursorPos.line - 1) * settings.fontSize * 1.6 + 12}px`,
              height: `${settings.fontSize * 1.6}px`,
              transform: textareaRef.current ? `translateY(-${textareaRef.current.scrollTop}px)` : undefined,
            }}
          />

          {/* Syntax Highlight Render View */}
          <pre
            id="syntax-highlight-overlay"
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-3 pb-12 font-mono whitespace-pre overflow-hidden pointer-events-none select-none z-0"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: '1.6',
              tabSize: settings.tabSize,
            }}
          >
            <code>
              {tokens.map((token, idx) => renderToken(token, idx))}
              {/* Ensure newline trailing space matches textarea height */}
              {'\n '}
            </code>
          </pre>

          {/* Real Input Textarea */}
          <textarea
            id="code-editor-textarea"
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              if (activeFile) {
                onUpdateContent(activeFile.id, e.target.value);
              }
              updateCursorPosition();
            }}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={`absolute inset-0 w-full h-full p-3 pb-12 font-mono bg-transparent resize-none outline-none z-10 whitespace-pre overflow-auto caret-amber-400 ${
              isDark ? 'text-transparent' : 'text-transparent'
            }`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: '1.6',
              tabSize: settings.tabSize,
              color: 'transparent',
              caretColor: isDark ? '#fbbf24' : '#2563eb',
            }}
          />
        </div>
      </div>
    </div>
  );
};
