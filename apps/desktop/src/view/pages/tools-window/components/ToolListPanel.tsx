import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2 } from "lucide-react"

export type ToolItem = {
  id: string
  name: string
  description?: string
  type: "tool"
  source?: string
  manual?: string
  parameters?: any
  tags?: string[]
}

export type SourceFilter = "all" | "system" | "plaza" | "user"

const AVATAR_COLORS = [
  "from-gray-600 to-gray-800",
  "from-slate-500 to-slate-700",
  "from-zinc-500 to-zinc-700",
  "from-neutral-500 to-neutral-700",
  "from-stone-500 to-stone-700",
  "from-gray-500 to-gray-700",
  "from-slate-600 to-slate-800",
  "from-zinc-600 to-zinc-800",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

type Props = {
  loading: boolean
  filteredTools: ToolItem[]
  sourceFilter: SourceFilter
  setSourceFilter: (f: SourceFilter) => void
  sourceStats: { system: number; plaza: number; user: number }
  query: string
  setQuery: (q: string) => void
  selectedTool: ToolItem | null
  onSelectTool: (t: ToolItem) => void
}

export default function ToolListPanel({
  loading, filteredTools, sourceFilter, setSourceFilter, sourceStats,
  query, setQuery, selectedTool, onSelectTool,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-[280px] border-r flex flex-col bg-muted/30 overflow-hidden">
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("tools.search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "system", "plaza", "user"] as const).map((f) => (
            <button
              key={f}
              className={`flex-1 rounded-md px-1.5 py-1 text-[11px] transition-colors ${
                sourceFilter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setSourceFilter(f)}
            >
              {t(`tools.filters.${f}`)}
              {f !== "all" && <span className="ml-0.5 opacity-70">({sourceStats[f]})</span>}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1">
          {loading && filteredTools.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t("tools.empty")}
            </div>
          ) : (
            filteredTools.map((tool) => (
              <button
                key={`${tool.source}-${tool.id}`}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors overflow-hidden ${
                  selectedTool?.id === tool.id && selectedTool?.source === tool.source
                    ? "bg-accent border border-border"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectTool(tool)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(tool.name)} text-white text-sm font-semibold`}>
                  {getInitial(tool.name)}
                </div>
                <div className="w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{tool.name}</span>
                    <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${
                      tool.source === "system"
                        ? "bg-blue-100 text-blue-700"
                        : tool.source === "project"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {t(`tools.filters.${tool.source === "project" ? "plaza" : (tool.source ?? "user")}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {tool.description || t("tools.noDescription")}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
