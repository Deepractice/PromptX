import * as React from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceExplorerPanel } from "./WorkspaceExplorerPanel";
import type { WorkspacePanelContentProps } from "./types";
import type { DirEntryItem } from "./explorerTypes";

export function WorkspaceExplorerAdapter({ isActive }: WorkspacePanelContentProps) {
  const {
    folders, expandedPaths, selectedPath, isLoading, dirCache,
    toggleExpanded, setSelectedPath, loadFolders, pickAndAddFolder,
    removeFolder, listDir, readFile, readFileBase64, writeFile, deleteItem,
    restoreExpandedDirs,
  } = useWorkspace();

  React.useEffect(() => {
    if (isActive) {
      loadFolders();
      restoreExpandedDirs();
    }
  }, [isActive]);

  const handleAddFolder = React.useCallback(async () => {
    await pickAndAddFolder();
  }, [pickAndAddFolder]);

  const handleLoadDir = React.useCallback(async (path: string): Promise<DirEntryItem[]> => {
    return await listDir(path);
  }, [listDir]);

  return (
    <WorkspaceExplorerPanel
      folders={folders}
      expandedPaths={expandedPaths}
      selectedPath={selectedPath}
      isLoading={isLoading}
      dirCache={dirCache}
      onAddFolder={handleAddFolder}
      onRemoveFolder={removeFolder}
      onToggleExpanded={toggleExpanded}
      onSelectPath={setSelectedPath}
      onLoadDir={handleLoadDir}
      onReadFile={readFile}
      onReadFileBase64={readFileBase64}
      onCreateFile={async (dirPath, name, content) => {
        const sep = dirPath.includes('/') ? '/' : '\\';
        await writeFile(dirPath.replace(/[/\\]+$/, '') + sep + name, content);
        await listDir(dirPath);
      }}
      onDeleteItem={async (path) => {
        await deleteItem(path);
      }}
    />
  );
}
