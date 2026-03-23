export interface WorkspaceFolderItem {
  id: string;
  path: string;
  name: string;
}

export interface DirEntryItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string | null;
}

export interface WorkspaceExplorerPanelProps {
  folders: WorkspaceFolderItem[];
  expandedPaths: Record<string, boolean>;
  selectedPath: string | null;
  isLoading: boolean;
  dirCache: Record<string, DirEntryItem[]>;
  onAddFolder: () => void;
  onRemoveFolder: (id: string) => void;
  onToggleExpanded: (path: string) => void;
  onSelectPath: (path: string | null) => void;
  onLoadDir: (path: string) => Promise<DirEntryItem[]>;
  onReadFile: (path: string) => Promise<string>;
  onReadFileBase64: (path: string) => Promise<string>;
  onCreateFile: (dirPath: string, name: string, content: string) => Promise<void>;
  onDeleteItem: (path: string) => Promise<void>;
}
