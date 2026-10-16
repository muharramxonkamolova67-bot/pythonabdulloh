import React, { useState, useRef, useEffect } from 'react';
import { FileItem } from '../../types';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  FolderPlus,
  Trash2,
  Edit2,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  X,
  FileUp,
} from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameItem: (id: string, newName: string) => void;
  onDeleteItem: (id: string) => void;
  onUploadFile: (name: string, content: string) => void;
  onDownloadProject: () => void;
  theme: 'dark' | 'light';
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem,
  onUploadFile,
  onDownloadProject,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [newEntryName, setNewEntryName] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if ((creatingType || renamingId) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [creatingType, renamingId]);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleStartCreate = (type: 'file' | 'folder', parentId: string | null = null) => {
    setCreatingType(type);
    setCreatingParentId(parentId);
    setNewEntryName(type === 'file' ? 'new_script.py' : 'new_folder');
  };

  const handleConfirmCreate = () => {
    if (!newEntryName.trim()) {
      setCreatingType(null);
      return;
    }

    let finalName = newEntryName.trim();
    if (creatingType === 'file' && !finalName.includes('.')) {
      finalName += '.py';
    }

    if (creatingType === 'file') {
      onCreateFile(finalName, creatingParentId);
    } else if (creatingType === 'folder') {
      onCreateFolder(finalName, creatingParentId);
    }

    setCreatingType(null);
    setNewEntryName('');
  };

  const handleStartRename = (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenamingName(item.name);
  };

  const handleConfirmRename = () => {
    if (renamingId && renamingName.trim()) {
      onRenameItem(renamingId, renamingName.trim());
    }
    setRenamingId(null);
    setRenamingName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onUploadFile(file.name, content || '');
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Build tree hierarchy
  const renderItem = (item: FileItem, depth = 0) => {
    const isFolder = item.isFolder;
    const isCollapsed = !!collapsedFolders[item.id];
    const isSelected = item.id === activeFileId;
    const isRenaming = item.id === renamingId;
    const isPy = item.name.endsWith('.py');

    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !isFolder) {
      return null;
    }

    return (
      <div key={item.id} className="select-none">
        <div
          id={`file-item-${item.id}`}
          onClick={() => {
            if (isFolder) {
              setCollapsedFolders((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
            } else {
              onSelectFile(item.id);
            }
          }}
          className={`group flex items-center justify-between px-2 py-1 text-xs cursor-pointer rounded transition-colors ${
            isSelected
              ? isDark
                ? 'bg-zinc-800 text-amber-400 font-semibold'
                : 'bg-blue-100 text-blue-800 font-semibold'
              : isDark
              ? 'hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100'
              : 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              <>
                <span className="text-zinc-400">
                  {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                </span>
                {isCollapsed ? (
                  <Folder size={14} className="text-amber-400 shrink-0" />
                ) : (
                  <FolderOpen size={14} className="text-amber-400 shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-3 shrink-0" />
                {isPy ? (
                  <span className="text-amber-500 font-bold shrink-0 text-[11px] leading-none">🐍</span>
                ) : (
                  <FileCode size={14} className="text-blue-400 shrink-0" />
                )}
              </>
            )}

            {isRenaming ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={renamingName}
                  onChange={(e) => setRenamingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="bg-zinc-950 border border-amber-500 text-zinc-100 px-1 py-0.5 rounded text-xs outline-none w-28 font-mono"
                />
                <button onClick={handleConfirmRename} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                  <Check size={12} />
                </button>
                <button onClick={() => setRenamingId(null)} className="p-0.5 text-zinc-400 hover:text-zinc-300">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="truncate font-mono">{item.name}</span>
            )}
          </div>

          {/* Action buttons on hover */}
          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
              {isFolder && (
                <button
                  id={`btn-add-file-to-${item.id}`}
                  title="Add file inside this folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCreate('file', item.id);
                  }}
                  className={`p-0.5 rounded ${
                    isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
                  }`}
                >
                  <Plus size={12} />
                </button>
              )}

              <button
                id={`btn-rename-${item.id}`}
                title="Rename"
                onClick={(e) => handleStartRename(item, e)}
                className={`p-0.5 rounded ${
                  isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
                }`}
              >
                <Edit2 size={11} />
              </button>

              <button
                id={`btn-delete-${item.id}`}
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className={`p-0.5 rounded ${
                  isDark ? 'hover:bg-red-950 text-red-400' : 'hover:bg-red-100 text-red-600'
                }`}
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Render child files if folder and expanded */}
        {isFolder && !isCollapsed && (
          <div className="flex flex-col">
            {files
              .filter((f) => f.parentId === item.id)
              .map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Top-level files & folders
  const rootItems = files.filter((f) => f.parentId === null);

  return (
    <div
      id="file-explorer-container"
      className={`flex flex-col h-full w-full overflow-hidden border select-none ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'
      }`}
    >
      {/* File Explorer Header */}
      <div
        id="explorer-header"
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs ${
          isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          <Folder size={14} className="text-amber-500" />
          <span>Files</span>
        </div>

        {/* Global Explorer Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            id="btn-new-file"
            title="New File (.py)"
            onClick={() => handleStartCreate('file', null)}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <Plus size={14} />
          </button>

          <button
            id="btn-new-folder"
            title="New Folder"
            onClick={() => handleStartCreate('folder', null)}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <FolderPlus size={14} />
          </button>

          <button
            id="btn-upload-file"
            title="Upload Python file from your computer"
            onClick={() => fileInputRef.current?.click()}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <FileUp size={14} />
          </button>

          <button
            id="btn-download-project"
            title="Download Workspace JSON/Files"
            onClick={onDownloadProject}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <Download size={14} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.txt,.json,.md"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Quick Search in Explorer */}
      <div className={`px-2 py-1.5 border-b ${isDark ? 'border-zinc-800/80 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'}`}>
        <div
          className={`flex items-center px-2 py-1 rounded border text-xs ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
          }`}
        >
          <Search size={12} className="text-zinc-400 mr-1.5 shrink-0" />
          <input
            id="explorer-search-input"
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full font-mono text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Input */}
      {creatingType && (
        <div
          className={`px-3 py-2 border-b flex items-center gap-1.5 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-blue-50 border-blue-200'
          }`}
        >
          {creatingType === 'file' ? (
            <span className="text-amber-500 font-bold text-xs">🐍</span>
          ) : (
            <Folder size={14} className="text-amber-500 shrink-0" />
          )}
          <input
            id="new-item-input"
            ref={inputRef}
            type="text"
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmCreate();
              if (e.key === 'Escape') setCreatingType(null);
            }}
            placeholder={creatingType === 'file' ? 'script.py' : 'folder_name'}
            className="flex-1 bg-zinc-950 border border-amber-500 text-zinc-100 px-1.5 py-0.5 rounded text-xs outline-none font-mono"
          />
          <button
            id="btn-confirm-create"
            onClick={handleConfirmCreate}
            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Check size={12} />
          </button>
          <button
            id="btn-cancel-create"
            onClick={() => setCreatingType(null)}
            className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {rootItems.map((item) => renderItem(item))}
      </div>

      {/* Workspace Footer Info */}
      <div
        className={`px-3 py-1.5 border-t text-[11px] flex items-center justify-between select-none ${
          isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-500'
        }`}
      >
        <span>{files.filter((f) => !f.isFolder).length} files</span>
        <span>Virtual FS</span>
      </div>
    </div>
  );
};
