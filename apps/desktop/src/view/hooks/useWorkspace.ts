import { useState, useCallback, useRef } from "react";

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
}

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string | null;
}

export function useWorkspace() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dirCache, setDirCache] = useState<Record<string, DirEntry[]>>({});
  const restoringRef = useRef(false);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.workspace.getFolders();
      setFolders(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickAndAddFolder = useCallback(async (): Promise<WorkspaceFolder | null> => {
    const picked = await window.electronAPI.workspace.pickFolder();
    if (!picked) return null;
    const folder = await window.electronAPI.workspace.addFolder(picked.path, picked.name);
    setFolders(prev => [...prev, folder]);
    return folder;
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    await window.electronAPI.workspace.removeFolder(id);
    setFolders(prev => {
      const folder = prev.find(f => f.id === id);
      if (folder) {
        setDirCache(prevCache => {
          const next = { ...prevCache };
          for (const key of Object.keys(next)) {
            if (key.startsWith(folder.path)) delete next[key];
          }
          return next;
        });
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const listDir = useCallback(async (dirPath: string): Promise<DirEntry[]> => {
    const entries = await window.electronAPI.workspace.listDir(dirPath);
    setDirCache(prev => ({ ...prev, [dirPath]: entries }));
    return entries;
  }, []);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const restoreExpandedDirs = useCallback(async () => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    try {
      const paths = Object.keys(expandedPaths).filter(p => expandedPaths[p]);
      await Promise.allSettled(paths.map(p => listDir(p)));
    } finally {
      restoringRef.current = false;
    }
  }, [expandedPaths, listDir]);

  const readFile = useCallback(async (filePath: string): Promise<string> => {
    return window.electronAPI.workspace.readFile(filePath);
  }, []);

  const readFileBase64 = useCallback(async (filePath: string): Promise<string> => {
    return window.electronAPI.workspace.readFileBase64(filePath);
  }, []);

  const writeFile = useCallback(async (filePath: string, content: string) => {
    await window.electronAPI.workspace.writeFile(filePath, content);
  }, []);

  const deleteItem = useCallback(async (itemPath: string) => {
    await window.electronAPI.workspace.deleteItem(itemPath);
    setDirCache(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(itemPath) || itemPath.startsWith(key)) delete next[key];
      }
      return next;
    });
  }, []);

  return {
    folders, expandedPaths, selectedPath, isLoading, dirCache,
    toggleExpanded, setSelectedPath, loadFolders, pickAndAddFolder,
    removeFolder, listDir, readFile, readFileBase64, writeFile, deleteItem,
    restoreExpandedDirs,
  };
}
