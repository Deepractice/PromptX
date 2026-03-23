import type { ReactNode, ComponentType } from "react";

export interface WorkspacePanelContentProps {
  isActive: boolean;
  onClose: () => void;
}

export interface WorkspacePanelPlugin {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  order: number;
  component: ComponentType<WorkspacePanelContentProps>;
  visible?: boolean;
}

export interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: WorkspacePanelPlugin[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}
