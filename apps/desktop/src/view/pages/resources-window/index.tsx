import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast, Toaster } from "sonner"
import ResourceEditor from "./components/ResourceEditor"
import { ResourceImporter } from "./components/ResourceImporter"
import { useTranslation } from "react-i18next"
import {
  Search,
  Upload,
  Star,
  Download,
  RefreshCw,
  Loader2,
  Store,
  Clock,
} from "lucide-react"

type ResourceItem = {
  id: string
  name: string
  description?: string
  type: "role" | "tool"
  source?: string
}

const AVATAR_COLORS = [
  "from-blue-400 to-indigo-500",
  "from-purple-400 to-pink-500",
  "from-green-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-green-500",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

// Mock tags for display
const MOCK_TAGS = ["AI", "NLP", "Code", "Writing", "Analysis", "Creative", "Data", "Search"]
function getTagsForItem(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const idx = Math.abs(hash) % MOCK_TAGS.length
  return [MOCK_TAGS[idx], MOCK_TAGS[(idx + 3) % MOCK_TAGS.length]]
}

export default function ResourcesPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ResourceItem[]>([])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "role" | "tool">("all")
  const [loading, setLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null)
  const [importerOpen, setImporterOpen] = useState(false)

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const typeOk = typeFilter === "all" || item.type === typeFilter
      const queryOk = q === "" || item.name.toLowerCase().includes(q)
      return typeOk && queryOk
    })
  }, [items, typeFilter, query])

  const loadResources = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI?.getGroupedResources()
      if (result?.success) {
        const { grouped } = result.data || {}
        const flat: ResourceItem[] = []
        Object.keys(grouped || {}).forEach((source) => {
          const group = grouped[source] || {}
          ;(group.roles || []).forEach((role: any) =>
            flat.push({ id: role.id || role.name, name: role.name, description: role.description, type: "role", source })
          )
          ;(group.tools || []).forEach((tool: any) =>
            flat.push({ id: tool.id || tool.name, name: tool.name, description: tool.description, type: "tool", source })
          )
        })
        setItems(flat)
      } else {
        toast.error(t("resources.messages.loadFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("resources.messages.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      loadResources()
      return
    }
    try {
      const result = await window.electronAPI?.searchResources(q.trim())
      if (result?.success) {
        const list: ResourceItem[] = (result.data || []).map((item: any) => ({
          id: item.id || item.name,
          name: item.name,
          description: item.description,
          source: item.source,
          type: item.type,
        }))
        setItems(list)
      }
    } catch {
      // keep current list
    }
  }

  const handleEdit = (item: ResourceItem) => {
    if ((item.source ?? "user") !== "user") {
      toast.error(t("resources.messages.editOnlyUser"))
      return
    }
    setEditingItem(item)
    setEditorOpen(true)
  }

  useEffect(() => {
    loadResources()
  }, [])

  return (
    <div className="min-h-full relative">
      <Toaster />
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card p-12 shadow-xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Store className="h-10 w-10 text-blue-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{t("resources.comingSoon.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("resources.comingSoon.description")}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Clock className="h-3.5 w-3.5" />
            {t("resources.comingSoon.badge")}
          </span>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-53px)]">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          {/* Blue Gradient Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] px-8 py-8">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-1">
                {t("resources.banner.title")}
              </h2>
              <p className="text-blue-100 text-sm mb-4">
                {t("resources.banner.subtitle")}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => setImporterOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {t("resources.banner.publishRole")}
                </Button>
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30 border border-white/30"
                  onClick={() => setImporterOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {t("resources.banner.publishTool")}
                </Button>
              </div>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/10 text-7xl font-bold">
              {items.length}
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -right-5 -bottom-10 h-32 w-32 rounded-full bg-white/5" />
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("resources.search.placeholder")}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border p-1">
              {(["all", "role", "tool"] as const).map((f) => (
                <button
                  key={f}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    typeFilter === f
                      ? "bg-blue-500 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setTypeFilter(f)}
                >
                  {f === "all" ? t("resources.filters.all") : f === "role" ? t("resources.filters.roles") : t("resources.filters.tools")}
                </button>
              ))}
            </div>
            <Button size="icon" variant="outline" onClick={loadResources} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Card Grid */}
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-30" />
              <p>{t("roles.empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const tags = getTagsForItem(item.name)
                return (
                  <div
                    key={`${item.type}-${item.source}-${item.id}`}
                    className="group cursor-pointer rounded-xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    onClick={() => handleEdit(item)}
                  >
                    {/* Card Header with gradient */}
                    <div className={`bg-gradient-to-r ${getAvatarColor(item.name)} p-4`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
                          {getInitial(item.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                          <p className="text-xs text-white/70">{item.source ?? "user"}</p>
                        </div>
                      </div>
                    </div>
                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {item.description || t("roles.noDescription")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${item.type === "role" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {t(`resources.types.${item.type}`)}
                        </span>
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            4.{Math.abs(item.name.charCodeAt(0) % 5) + 5}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {Math.abs(item.name.charCodeAt(0) * 17) % 500 + 100}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-blue-500 hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(item)
                          }}
                        >
                          {t("resources.actions.use")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-center py-4">
            <span className="text-sm text-muted-foreground">{t("resources.messages.noMore")}</span>
          </div>
        </div>
      </ScrollArea>

      {/* Editor & Importer */}
      <ResourceEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingItem(null) }}
        editingItem={editingItem}
        onResourceUpdated={loadResources}
      />
      <ResourceImporter
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        onImportSuccess={loadResources}
      />
    </div>
  )
}
