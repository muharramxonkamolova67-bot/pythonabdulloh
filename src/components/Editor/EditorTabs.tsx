import React from 'react';
import { TabItem, FileItem } from '../../types';
import { X, Plus, Code, FileText, Check } from 'lucide-react';

interface EditorTabsProps {
  tabs: TabItem[];
  activeFileId: string | null;
  files: FileItem[];
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onNewFile: () => void;
  isSaved: boolean;
  theme: 'dark' | 'light';
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeFileId,
  files,
  onSelectTab,
  onCloseTab,
  onNewFile,
  isSaved,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      id="editor-tabs-bar"
      className={`flex items-center justify-between border-b select-none overflow-x-auto ${
        isDark
          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
          : 'bg-zinc-100 border-zinc-300 text-zinc-700'
      }`}
    >
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.fileId === activeFileId;
          const file = files.find((f) => f.id === tab.fileId);
          const isDirty = file?.isDirty;
          const isPy = tab.name.endsWith('.py');

          return (
            <div
              key={tab.fileId}
              id={`tab-${tab.fileId}`}
              onClick={() => onSelectTab(tab.fileId)}
              className={`group relative flex items-center gap-2 px-3 py-2 text-xs font-mono border-r cursor-pointer transition-colors max-w-[200px] shrink-0 ${
                isActive
                  ? isDark
                    ? 'bg-zinc-900 text-zinc-100 font-semibold border-b-2 border-b-amber-500 border-r-zinc-800'
                    : 'bg-white text-zinc-950 font-semibold border-b-2 border-b-blue-600 border-r-zinc-300 shadow-xs'
                  : isDark
                  ? 'hover:bg-zinc-900/50 hover:text-zinc-200 border-r-zinc-800/80'
                  : 'hover:bg-zinc-200/70 hover:text-zinc-900 border-r-zinc-300'
              }`}
            >
              {/* File type icon */}
              {isPy ? (
                <span className="text-amber-500 font-bold shrink-0 text-[11px] leading-none">
                  🐍
                </span>
              ) : (
                <FileText size={13} className="text-zinc-400 shrink-0" />
              )}

              {/* Tab title */}
              <span className="truncate">{tab.name}</span>

              {/* Dirty indicator / Close button */}
              <div className="flex items-center ml-1">
                {isDirty ? (
                  <span
                    title="Unsaved changes"
                    className="w-2 h-2 rounded-full bg-amber-400 block group-hover:hidden"
                  />
                ) : null}

                <button
                  id={`btn-close-tab-${tab.fileId}`}
                  title="Close tab"
                  onClick={(e) => onCloseTab(tab.fileId, e)}
                  className={`p-0.5 rounded transition-opacity ${
                    isDirty ? 'hidden group-hover:block' : 'opacity-60 group-hover:opacity-100'
                  } ${
                    isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-zinc-300 text-zinc-600'
                  }`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {/* New File shortcut button inside tab bar */}
        <button
          id="btn-new-tab"
          title="New Python file"
          onClick={onNewFile}
          className={`p-2 ml-1 rounded text-xs transition-colors ${
            isDark
              ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
          }`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Right status indicator (Saved / Live sync) */}
      <div className="px-3 py-1 text-[11px] flex items-center gap-1.5 text-zinc-400 shrink-0">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="hidden sm:inline">Auto-saved</span>
      </div>
    </div>
  );
};
