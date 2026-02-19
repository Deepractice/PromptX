import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/components/agentx-ui/utils/utils";

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  /**
   * Current search value (controlled)
   */
  value: string;
  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;
  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void;
  /**
   * Show search icon on the left
   * @default true
   */
  showSearchIcon?: boolean;
  /**
   * Show clear button when input has value
   * @default true
   */
  showClearButton?: boolean;
  /**
   * Custom search icon element
   */
  searchIcon?: React.ReactNode;
  /**
   * Custom clear icon element
   */
  clearIcon?: React.ReactNode;
}

/**
 * SearchInput - Input field with search icon and clear button
 *
 * A specialized input component for search functionality with built-in
 * search icon and clear button. Fully controlled with onChange callback.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [search, setSearch] = useState("");
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search sessions..."
 * />
 *
 * // With custom clear handler
 * <SearchInput
 *   value={searchFilter}
 *   onChange={setSearchFilter}
 *   onClear={() => {
 *     setSearchFilter("");
 *     resetResults();
 *   }}
 * />
 *
 * // Without search icon
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   showSearchIcon={false}
 * />
 *
 * // Custom styling
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   className="bg-muted/50 focus:bg-background"
 * />
 * ```
 */
export const SearchInput: React.ForwardRefExoticComponent<
  SearchInputProps & React.RefAttributes<HTMLInputElement>
> = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      showSearchIcon = true,
      showClearButton = true,
      searchIcon,
      clearIcon,
      placeholder = "Search...",
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onChange("");
      }
    };

    const hasValue = value && value.length > 0;

    return (
      <div className="relative">
        {/* Search Icon */}
        {showSearchIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {searchIcon || <Search className="w-4 h-4" />}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            showSearchIcon && "pl-9",
            hasValue && showClearButton && "pr-9",
            className
          )}
          {...props}
        />

        {/* Clear Button */}
        {hasValue && showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2",
              "p-1 rounded hover:bg-accent transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Clear search"
          >
            {clearIcon || <X className="w-3 h-3" />}
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
