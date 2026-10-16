export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  isFolder: boolean;
  parentId: string | null;
  isExpanded?: boolean;
  isDirty?: boolean;
}

export interface TabItem {
  fileId: string;
  name: string;
  path: string;
}

export type TerminalPosition = 'bottom' | 'right' | 'left';
export type ExplorerPosition = 'left' | 'right' | 'hidden';
export type ThemeMode = 'dark' | 'light';

export type TerminalLineType = 'stdout' | 'stderr' | 'stdin' | 'system' | 'prompt' | 'info';

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  text: string;
  timestamp: number;
}

export type ExecutionStatus = 'idle' | 'loading' | 'running' | 'waiting_input' | 'error' | 'stopped' | 'success';

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  autoCloseBrackets: boolean;
  autoCloseQuotes: boolean;
  autoInsertPrint: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
}

export interface ExampleSnippet {
  id: string;
  title: string;
  description: string;
  category: 'Basics' | 'Interactive' | 'OOP' | 'Algorithms' | 'Data Structures';
  files: {
    name: string;
    path: string;
    content: string;
  }[];
}
