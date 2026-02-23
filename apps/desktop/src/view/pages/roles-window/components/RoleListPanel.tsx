import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2 } from "lucide-react"

type RoleItem = {
  id: string
  name: string
  description?: string
  type: "role"
  source?: string
  version?: "v1" | "v2"
}

type VersionFilter = "v1" | "v2"
type SourceFilter = "all" | "system" | "plaza" | "user"

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
  filteredRoles: RoleItem[]
  versionFilter: VersionFilter
  setVersionFilter: (v: VersionFilter) => void
  versionStats: { v1: number; v2: number }
  sourceFilter: SourceFilter
  setSourceFilter: (f: SourceFilter) => void
  sourceStats: { system: number; plaza: number; user: number }
  query: string
  setQuery: (q: string) => void
  selectedRole: RoleItem | null
  setSelectedRole: (r: RoleItem) => void
  enableV2?: boolean
}

export default function RoleListPanel({
  loading, filteredRoles, versionFilter, setVersionFilter, versionStats,
  sourceFilter, setSourceFilter, sourceStats, query, setQuery,
  selectedRole, setSelectedRole, enableV2 = true,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-[280px] border-r flex flex-col bg-muted/30 overflow-hidden">
      <div className="p-3 space-y-2">
        {/* Version toggle — hidden when V2 is disabled */}
        {enableV2 && (
          <div className="flex gap-1">
            {(["v1", "v2"] as const).map((v) => (
              <button
                key={v}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  versionFilter === v
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => { setVersionFilter(v); setSourceFilter("all") }}
              >
                {v === "v1" ? "V1 DPML" : "V2 Rolex"}
                <span className="ml-1 opacity-70">({versionStats[v]})</span>
              </button>
            ))}
          </div>
        )}
        {/* Source sub-filter */}
        <div className="flex gap-1">
          {(["all", "system", "plaza", "user"] as const).map((f) => (
            <button
              key={f}
              className={`flex-1 rounded-md px-1 py-0.5 text-[10px] transition-colors ${
                sourceFilter === f
                  ? "bg-foreground/80 text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setSourceFilter(f)}
            >
              {t(`roles.filters.${f}`)}
              {f !== "all" && <span className="ml-0.5 opacity-70">({sourceStats[f]})</span>}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("roles.search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1">
          {loading && filteredRoles.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t("roles.empty")}
            </div>
          ) : (
            filteredRoles.map((role) => (
              <button
                key={`${role.source}-${role.id}`}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedRole?.id === role.id && selectedRole?.source === role.source
                    ? "bg-accent border border-border"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(role.name)} text-white text-sm font-semibold`}>
                  {getInitial(role.name)}
                </div>
                <div className="w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{role.name}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      role.source === "system"
                        ? "bg-blue-100 text-blue-700"
                        : role.source === "project"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {t(`roles.filters.${role.source === "project" ? "plaza" : (role.source ?? "user")}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {role.description || t("roles.noDescription")}
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

export type { RoleItem, VersionFilter, SourceFilter }
