import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileItem,
  TabItem,
  TerminalLine,
  ExecutionStatus,
  TerminalPosition,
  ExplorerPosition,
  ThemeMode,
  EditorSettings,
  ExampleSnippet,
} from './types';
import { INITIAL_FILES } from './services/defaultFiles';
import { pythonRunner } from './services/pythonRunner';
import { Header } from './components/Header/Header';
import { FileExplorer } from './components/FileExplorer/FileExplorer';
import { CodeEditor } from './components/Editor/CodeEditor';
import { InteractiveTerminal } from './components/Terminal/InteractiveTerminal';
import { StatusBar } from './components/StatusBar/StatusBar';

const LOCAL_STORAGE_KEY_FILES = 'pyide_workspace_files_v2';
const LOCAL_STORAGE_KEY_TABS = 'pyide_workspace_tabs_v2';
const LOCAL_STORAGE_KEY_THEME = 'pyide_workspace_theme';
const LOCAL_STORAGE_KEY_LAYOUT = 'pyide_workspace_layout';
const LOCAL_STORAGE_KEY_SETTINGS = 'pyide_workspace_settings';

export default function App() {
  // 1. Files & Tabs State
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_FILES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return files.find((f) => !f.isFolder)?.id || '1';
  });

  const [tabs, setTabs] = useState<TabItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TABS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { fileId: '1', name: 'main.py', path: 'main.py' },
      { fileId: '2', name: 'utils.py', path: 'utils.py' },
    ];
  });

  // 2. Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
    return saved === 'light' ? 'light' : 'dark';
  });

  // 3. Layout State
  const [terminalPos, setTerminalPos] = useState<TerminalPosition>('bottom');
  const [explorerPos, setExplorerPos] = useState<ExplorerPosition>('left');
  const [explorerWidth, setExplorerWidth] = useState<number>(240);
  const [terminalSize, setTerminalSize] = useState<number>(240); // height if bottom, width if left/right

  // 4. Editor Settings State
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      fontSize: 13,
      tabSize: 4,
      autoCloseBrackets: true,
      autoCloseQuotes: true,
      autoInsertPrint: true,
      lineNumbers: true,
      wordWrap: false,
    };
  });

  // 5. Terminal & Execution State
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [isWaitingInput, setIsWaitingInput] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');

  // Dragging / Resizing State
  const [isDraggingExplorer, setIsDraggingExplorer] = useState(false);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_FILES, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TABS, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-zinc-100 antialiased overflow-hidden select-none';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-zinc-100 text-zinc-900 antialiased overflow-hidden select-none';
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Set Python runner handlers
  useEffect(() => {
    pythonRunner.setHandlers({
      onStdout: (text: string) => {
        setTerminalLines((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'stdout', text, timestamp: Date.now() },
        ]);
      },
      onStderr: (text: string) => {
        setTerminalLines((prev) => [
          ...prev,
          { id: Math.random().toString(), type: 'stderr', text, timestamp: Date.now() },
        ]);
      },
      onStdinRequest: async (prompt: string) => {
        setIsWaitingInput(true);
        setInputPrompt(prompt);
        return new Promise<string>((resolve) => {
          (window as any).__pendingStdinResolve = resolve;
        });
      },
      onStatusChange: (status: ExecutionStatus, msg?: string) => {
        setExecutionStatus(status);
        if (msg) setStatusMessage(msg);
        if (status !== 'waiting_input') {
          setIsWaitingInput(false);
        }
      },
      onClear: () => {
        setTerminalLines([]);
      },
    });

    // Pre-initialize Pyodide in background
    pythonRunner.initialize().catch((err) => {
      console.warn('Background Pyodide init error:', err);
    });
  }, []);

  // Run Script Handler
  const handleRun = useCallback(async () => {
    const activeFile = files.find((f) => f.id === activeFileId);
    if (!activeFile) return;

    // Add separator to terminal
    setTerminalLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'system',
        text: `\n🚀 [Running ${activeFile.path}] -- ${new Date().toLocaleTimeString()}\n`,
        timestamp: Date.now(),
      },
    ]);

    await pythonRunner.execute(activeFile.content, activeFile.path, files);
  }, [activeFileId, files]);

  // Stop Script Handler
  const handleStop = useCallback(() => {
    pythonRunner.stop();
    setIsWaitingInput(false);
    if ((window as any).__pendingStdinResolve) {
      delete (window as any).__pendingStdinResolve;
    }
  }, []);

  // Submit Interactive Stdin Input
  const handleSubmitInput = useCallback((val: string) => {
    setIsWaitingInput(false);
    setInputPrompt('');
    setTerminalLines((prev) => [
      ...prev,
      { id: Math.random().toString(), type: 'stdin', text: val + '\n', timestamp: Date.now() },
    ]);
    if ((window as any).__pendingStdinResolve) {
      const res = (window as any).__pendingStdinResolve;
      delete (window as any).__pendingStdinResolve;
      res(val);
    }
    pythonRunner.submitUserInput(val);
  }, []);

  // Run REPL command
  const handleRunRepl = useCallback(async (cmd: string) => {
    await pythonRunner.executeRepl(cmd);
  }, []);

  // Clear Terminal
  const handleClearTerminal = useCallback(() => {
    setTerminalLines([]);
  }, []);

  // File Selection
  const handleSelectFile = useCallback((fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || file.isFolder) return;

    setActiveFileId(fileId);

    // Ensure open in tabs
    setTabs((prev) => {
      if (prev.some((t) => t.fileId === fileId)) return prev;
      return [...prev, { fileId: file.id, name: file.name, path: file.path }];
    });
  }, [files]);

  // Tab Close
  const handleCloseTab = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.fileId !== fileId);
      if (next.length === 0) {
        return [];
      }
      if (activeFileId === fileId) {
        const idx = prev.findIndex((t) => t.fileId === fileId);
        const newActive = next[Math.min(idx, next.length - 1)];
        setActiveFileId(newActive.fileId);
      }
      return next;
    });
  }, [activeFileId]);

  // Update File Content
  const handleUpdateContent = useCallback((fileId: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content, isDirty: false } : f))
    );
  }, []);

  // Create File
  const handleCreateFile = useCallback((name: string, parentId: string | null) => {
    const parent = parentId ? files.find((f) => f.id === parentId) : null;
    const path = parent ? `${parent.path}/${name}` : name;
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      path,
      content: name.endsWith('.py') ? `# ${name}\n\n` : '',
      isFolder: false,
      parentId,
      isDirty: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setTabs((prev) => [...prev, { fileId: newFile.id, name: newFile.name, path: newFile.path }]);
  }, [files]);

  // Create Folder
  const handleCreateFolder = useCallback((name: string, parentId: string | null) => {
    const parent = parentId ? files.find((f) => f.id === parentId) : null;
    const path = parent ? `${parent.path}/${name}` : name;
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      path,
      content: '',
      isFolder: true,
      parentId,
      isExpanded: true,
    };

    setFiles((prev) => [...prev, newFolder]);
  }, [files]);

  // Rename Item
  const handleRenameItem = useCallback((id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const parts = f.path.split('/');
          parts[parts.length - 1] = newName;
          const newPath = parts.join('/');
          return { ...f, name: newName, path: newPath };
        }
        return f;
      })
    );

    setTabs((prev) =>
      prev.map((t) => (t.fileId === id ? { ...t, name: newName } : t))
    );
  }, []);

  // Delete Item
  const handleDeleteItem = useCallback((id: string) => {
    const item = files.find((f) => f.id === id);
    if (!item) return;

    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    setFiles((prev) => {
      // If folder, delete all descendants too
      const idsToDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of prev) {
          if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
            idsToDelete.add(f.id);
            changed = true;
          }
        }
      }
      return prev.filter((f) => !idsToDelete.has(f.id));
    });

    setTabs((prev) => prev.filter((t) => t.fileId !== id));
  }, [files]);

  // Upload local file
  const handleUploadFile = useCallback((name: string, content: string) => {
    const newFile: FileItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      name,
      path: name,
      content,
      isFolder: false,
      parentId: null,
      isDirty: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setTabs((prev) => [...prev, { fileId: newFile.id, name: newFile.name, path: newFile.path }]);
  }, []);

  // Download project as JSON/Files
  const handleDownloadProject = useCallback(() => {
    const data = JSON.stringify(files, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python_project_workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  // Load Example Template
  const handleLoadExample = useCallback((template: ExampleSnippet) => {
    if (template.files.length === 0) return;
    const newFiles: FileItem[] = template.files.map((tf, i) => ({
      id: (Date.now() + i).toString(),
      name: tf.name,
      path: tf.path,
      content: tf.content,
      isFolder: false,
      parentId: null,
      isDirty: false,
    }));

    setFiles(newFiles);
    setActiveFileId(newFiles[0].id);
    setTabs(newFiles.map((f) => ({ fileId: f.id, name: f.name, path: f.path })));

    setTerminalLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'info',
        text: `\n✨ Loaded template: "${template.title}"\n`,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Reset workspace
  const handleResetWorkspace = useCallback(() => {
    setFiles(INITIAL_FILES);
    setActiveFileId('1');
    setTabs([
      { fileId: '1', name: 'main.py', path: 'main.py' },
      { fileId: '2', name: 'utils.py', path: 'utils.py' },
    ]);
    setTerminalLines([]);
  }, []);

  // Drag Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingExplorer) {
        if (explorerPos === 'left') {
          setExplorerWidth(Math.max(160, Math.min(480, e.clientX)));
        } else if (explorerPos === 'right') {
          setExplorerWidth(Math.max(160, Math.min(480, window.innerWidth - e.clientX)));
        }
      }

      if (isDraggingTerminal) {
        if (terminalPos === 'bottom') {
          setTerminalSize(Math.max(120, Math.min(window.innerHeight - 150, window.innerHeight - e.clientY)));
        } else if (terminalPos === 'right') {
          setTerminalSize(Math.max(220, Math.min(window.innerWidth - 300, window.innerWidth - e.clientX)));
        } else if (terminalPos === 'left') {
          setTerminalSize(Math.max(220, Math.min(window.innerWidth - 300, e.clientX)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingExplorer(false);
      setIsDraggingTerminal(false);
    };

    if (isDraggingExplorer || isDraggingTerminal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingExplorer, isDraggingTerminal, explorerPos, terminalPos]);

  const activeFile = files.find((f) => f.id === activeFileId);
  const isDark = theme === 'dark';

  return (
    <div
      id="python-ide-root"
      ref={containerRef}
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* 1. Header Toolbar */}
      <Header
        onRun={handleRun}
        onStop={handleStop}
        executionStatus={executionStatus}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        terminalPos={terminalPos}
        onChangeTerminalPos={setTerminalPos}
        explorerPos={explorerPos}
        onChangeExplorerPos={setExplorerPos}
        onLoadExample={handleLoadExample}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* 2. Main Workspace Layout */}
      <div id="workspace-layout-area" className="flex-1 flex overflow-hidden relative">
        {/* Left Explorer (if explorerPos === 'left') */}
        {explorerPos === 'left' && (
          <>
            <div style={{ width: `${explorerWidth}px` }} className="h-full shrink-0">
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRenameItem={handleRenameItem}
                onDeleteItem={handleDeleteItem}
                onUploadFile={handleUploadFile}
                onDownloadProject={handleDownloadProject}
                theme={theme}
              />
            </div>
            {/* Draggable vertical splitter */}
            <div
              id="splitter-explorer-left"
              onMouseDown={() => setIsDraggingExplorer(true)}
              className={`w-1 cursor-col-resize hover:bg-amber-500/50 transition-colors z-20 shrink-0 ${
                isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            />
          </>
        )}

        {/* Left Terminal (if terminalPos === 'left') */}
        {terminalPos === 'left' && (
          <>
            <div style={{ width: `${terminalSize}px` }} className="h-full shrink-0">
              <InteractiveTerminal
                lines={terminalLines}
                executionStatus={executionStatus}
                statusMessage={statusMessage}
                isWaitingInput={isWaitingInput}
                inputPrompt={inputPrompt}
                onSubmitInput={handleSubmitInput}
                onClear={handleClearTerminal}
                onStop={handleStop}
                onRunRepl={handleRunRepl}
                theme={theme}
                fontSize={editorSettings.fontSize}
              />
            </div>
            {/* Draggable vertical splitter */}
            <div
              id="splitter-terminal-left"
              onMouseDown={() => setIsDraggingTerminal(true)}
              className={`w-1 cursor-col-resize hover:bg-amber-500/50 transition-colors z-20 shrink-0 ${
                isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            />
          </>
        )}

        {/* Central Editor & Bottom/Side Terminal Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {terminalPos === 'bottom' ? (
            <>
              {/* Center Editor */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditor
                  files={files}
                  activeFileId={activeFileId}
                  tabs={tabs}
                  onSelectTab={handleSelectFile}
                  onCloseTab={handleCloseTab}
                  onNewFile={() => handleCreateFile('script.py', null)}
                  onUpdateContent={handleUpdateContent}
                  onRun={handleRun}
                  isRunning={executionStatus === 'running' || executionStatus === 'waiting_input'}
                  theme={theme}
                  settings={editorSettings}
                  onUpdateSettings={(newSettings) =>
                    setEditorSettings((prev) => ({ ...prev, ...newSettings }))
                  }
                />
              </div>

              {/* Draggable horizontal splitter */}
              <div
                id="splitter-terminal-bottom"
                onMouseDown={() => setIsDraggingTerminal(true)}
                className={`h-1 cursor-row-resize hover:bg-amber-500/50 transition-colors z-20 shrink-0 ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                }`}
              />

              {/* Bottom Terminal */}
              <div style={{ height: `${terminalSize}px` }} className="shrink-0 overflow-hidden">
                <InteractiveTerminal
                  lines={terminalLines}
                  executionStatus={executionStatus}
                  statusMessage={statusMessage}
                  isWaitingInput={isWaitingInput}
                  inputPrompt={inputPrompt}
                  onSubmitInput={handleSubmitInput}
                  onClear={handleClearTerminal}
                  onStop={handleStop}
                  onRunRepl={handleRunRepl}
                  theme={theme}
                  fontSize={editorSettings.fontSize}
                />
              </div>
            </>
          ) : (
            /* Center Editor (when terminal is on left or right) */
            <div className="flex-1 h-full overflow-hidden">
              <CodeEditor
                files={files}
                activeFileId={activeFileId}
                tabs={tabs}
                onSelectTab={handleSelectFile}
                onCloseTab={handleCloseTab}
                onNewFile={() => handleCreateFile('script.py', null)}
                onUpdateContent={handleUpdateContent}
                onRun={handleRun}
                isRunning={executionStatus === 'running' || executionStatus === 'waiting_input'}
                theme={theme}
                settings={editorSettings}
                onUpdateSettings={(newSettings) =>
                  setEditorSettings((prev) => ({ ...prev, ...newSettings }))
                }
              />
            </div>
          )}
        </div>

        {/* Right Terminal (if terminalPos === 'right') */}
        {terminalPos === 'right' && (
          <>
            {/* Draggable vertical splitter */}
            <div
              id="splitter-terminal-right"
              onMouseDown={() => setIsDraggingTerminal(true)}
              className={`w-1 cursor-col-resize hover:bg-amber-500/50 transition-colors z-20 shrink-0 ${
                isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            />
            <div style={{ width: `${terminalSize}px` }} className="h-full shrink-0">
              <InteractiveTerminal
                lines={terminalLines}
                executionStatus={executionStatus}
                statusMessage={statusMessage}
                isWaitingInput={isWaitingInput}
                inputPrompt={inputPrompt}
                onSubmitInput={handleSubmitInput}
                onClear={handleClearTerminal}
                onStop={handleStop}
                onRunRepl={handleRunRepl}
                theme={theme}
                fontSize={editorSettings.fontSize}
              />
            </div>
          </>
        )}

        {/* Right Explorer (if explorerPos === 'right') */}
        {explorerPos === 'right' && (
          <>
            {/* Draggable vertical splitter */}
            <div
              id="splitter-explorer-right"
              onMouseDown={() => setIsDraggingExplorer(true)}
              className={`w-1 cursor-col-resize hover:bg-amber-500/50 transition-colors z-20 shrink-0 ${
                isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            />
            <div style={{ width: `${explorerWidth}px` }} className="h-full shrink-0">
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRenameItem={handleRenameItem}
                onDeleteItem={handleDeleteItem}
                onUploadFile={handleUploadFile}
                onDownloadProject={handleDownloadProject}
                theme={theme}
              />
            </div>
          </>
        )}
      </div>

      {/* 3. Status Bar */}
      <StatusBar
        executionStatus={executionStatus}
        statusMessage={statusMessage}
        theme={theme}
        activeFileName={activeFile?.name}
      />
    </div>
  );
}
