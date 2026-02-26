/**
 * ListPane - Generic list panel component
 *
 * A pure UI component for displaying lists with:
 * - Header with title and action button
 * - Optional search input
 * - Scrollable list of items
 * - Empty state handling
 * - Loading state
 *
 * This component knows nothing about business concepts like
 * "Agent", "Image", "Session", etc. It only deals with generic
 * "items" that have id, title, subtitle, etc.
 *
 * @example
 * ```tsx
 * <ListPane
 *   title="Conversations"
 *   items={items}
 *   selectedId={selectedId}
 *   onSelect={(id) => setSelectedId(id)}
 *   onDelete={(id) => handleDelete(id)}
 *   onNew={() => handleNew()}
 *   searchable
 * />
 * ```
 */

import * as React from "react";
import { Plus, Trash2, Pencil, ChevronsLeft } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";
import { ListItem } from "@/components/agentx-ui/components/element/ListItem";
import { SearchInput } from "@/components/agentx-ui/components/element/SearchInput";
import { EmptyState } from "@/components/agentx-ui/components/element/EmptyState";
import { TimeAgo } from "@/components/agentx-ui/components/element/TimeAgo";
import { Sidebar } from "@/components/agentx-ui/components/layout/Sidebar";

/**
 * Item data for ListPane
 */
export interface ListPaneItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Main title
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: React.ReactNode;
  /**
   * Optional leading content (icon, avatar, etc.)
   */
  leading?: React.ReactNode;
  /**
   * Optional trailing content (badge, status, etc.)
   */
  trailing?: React.ReactNode;
  /**
   * Whether this item is currently active
   */
  active?: boolean;
  /**
   * Timestamp for display
   */
  timestamp?: number;
}

export interface ListPaneProps {
  /**
   * Panel title displayed in header
   */
  title?: string;
  /**
   * List of items to display
   */
  items: ListPaneItem[];
  /**
   * Currently selected item ID
   */
  selectedId?: string | null;
  /**
   * Whether the list is loading
   */
  isLoading?: boolean;
  /**
   * Enable search functionality
   */
  searchable?: boolean;
  /**
   * Placeholder for search input
   */
  searchPlaceholder?: string;
  /**
   * Show new item button
   */
  showNewButton?: boolean;
  /**
   * Label for new button (tooltip)
   */
  newButtonLabel?: string;
  /**
   * Show collapse button in header
   * @default false
   */
  showCollapseButton?: boolean;
  /**
   * Callback when collapse button is clicked
   */
  onCollapse?: () => void;
  /**
   * Empty state configuration
   */
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
  };
  /**
   * Callback when an item is selected
   */
  onSelect?: (id: string) => void;
  /**
   * Callback when edit is clicked on an item
   */
  onEdit?: (id: string, currentTitle: string) => void;
  /**
   * Callback when delete is clicked on an item
   */
  onDelete?: (id: string) => void;
  /**
   * Callback when new button is clicked
   */
  onNew?: () => void;
  /**
   * Custom render function for item actions
   */
  renderItemActions?: (item: ListPaneItem) => React.ReactNode;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ListPane component
 */
export const ListPane: React.ForwardRefExoticComponent<
  ListPaneProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, ListPaneProps>(
  (
    {
      title = "Items",
      items,
      selectedId,
      isLoading = false,
      searchable = false,
      searchPlaceholder = "Search...",
      showNewButton = true,
      newButtonLabel = "New item",
      showCollapseButton = false,
      onCollapse,
      emptyState = {
        title: "No items",
        description: "Get started by creating a new item",
        actionLabel: "Create new",
      },
      onSelect,
      onEdit,
      onDelete,
      onNew,
      renderItemActions,
      className,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("");

    // Filter items by search query
    const filteredItems = React.useMemo(() => {
      if (!searchQuery.trim()) return items;
      const query = searchQuery.toLowerCase();
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (typeof item.subtitle === "string" && item.subtitle.toLowerCase().includes(query))
      );
    }, [items, searchQuery]);

    // Default action buttons renderer
    const defaultRenderActions = (item: ListPaneItem) => {
      if (!onEdit && !onDelete) return null;
      return (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              className="w-6 h-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id, item.title);
              }}
              title="Rename"
            >
              <Pencil className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </button>
          )}
          {onDelete && (
            <button
              className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      );
    };

    const actionsRenderer = renderItemActions || defaultRenderActions;

    return (
      <Sidebar ref={ref} className={cn("flex flex-col", className)}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          {showCollapseButton && onCollapse && (
            <button
              className="p-1 rounded hover:bg-accent transition-colors"
              onClick={onCollapse}
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <h2 className="text-sm font-semibold text-foreground flex-1">{title}</h2>
        </div>

        {/* Search + New Button */}
        {(searchable || showNewButton) && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            {searchable && (
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}
            {showNewButton && onNew && (
              <button
                className="p-1.5 rounded hover:bg-accent transition-colors flex-shrink-0"
                onClick={onNew}
                title={newButtonLabel}
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* List content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
              action={
                emptyState.actionLabel && onNew ? (
                  <button
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    onClick={onNew}
                  >
                    {emptyState.actionLabel}
                  </button>
                ) : undefined
              }
              spacing="sm"
            />
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <ListItem
                  key={item.id}
                  leading={item.leading}
                  title={item.title}
                  subtitle={
                    item.subtitle ||
                    (item.timestamp ? (
                      <TimeAgo
                        date={new Date(item.timestamp)}
                        className="text-xs text-muted-foreground"
                      />
                    ) : undefined)
                  }
                  trailing={item.trailing}
                  actions={actionsRenderer(item)}
                  selected={selectedId === item.id}
                  active={item.active}
                  showActiveIndicator={item.active}
                  onClick={() => onSelect?.(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Sidebar>
    );
  }
);

ListPane.displayName = "ListPane";
