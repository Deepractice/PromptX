import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Pickaxe, UserRoundPen, Database, SquarePen, FolderDown, Trash } from "lucide-react"
import { toast, Toaster } from "sonner"
import ResourceEditor from "./components/ResourceEditor"
import { useTranslation } from "react-i18next"

type ResourceItem = {
  id: string
  name: string
  description?: string
  type: "role" | "tool"
  source?: string
}

export default function ResourcesPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ResourceItem[]>([])
  const [query, setQuery] = useState("")

  // 新增：筛选状态
  const [typeFilter, setTypeFilter] = useState<"all" | "role" | "tool">("all")
  const [sourceFilter, setSourceFilter] = useState<"all" | "system" | "user">("all")

  // 新增：根据筛选与搜索计算结果
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      const typeOk = typeFilter === "all" || item.type === typeFilter
      const src = item.source ?? "user"
      const sourceOk = sourceFilter === "all" || src === sourceFilter
      const queryOk = q === "" || item.name.toLowerCase().includes(q)
      return typeOk && sourceOk && queryOk
    })
  }, [items, typeFilter, sourceFilter, query])
  const loadResources = async () => {
    try {
      const result = await window.electronAPI?.getGroupedResources()
      if (result?.success) {
        const { grouped, statistics } = result.data || {}
        const flat: ResourceItem[] = []
        Object.keys(grouped || {}).forEach(source => {
          const group = grouped[source] || {}
          ;(group.roles || []).forEach((role: any) => flat.push({ id: role.id || role.name, name: role.name, description: role.description, type: "role", source }))
          ;(group.tools || []).forEach((tool: any) => flat.push({ id: tool.id || tool.name, name: tool.name, description: tool.description, type: "tool", source }))
        })
        setItems(flat)
        console.log("Loaded resources:", flat)
        console.log("Loaded statistics:", statistics)

        // 使用统一的计算函数
      } else {
        toast.error(t("resources.messages.loadFailed"))
      }
    } catch (e: any) {
      console.error("Failed to load resources:", e)
      toast.error(e?.message || t("resources.messages.loadFailed"))
    }
  }

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      // 清空搜索回到初始列表
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
          type: item.type
        }))
        setItems(list)
      } else {
        toast.error(t("resources.messages.searchFailed"))
      }
    } catch (e: any) {
      console.error("Search failed:", e)
      toast.error(e?.message || t("resources.messages.searchFailed"))
    }
  }

  useEffect(() => {
    loadResources()
    // 可选：独立统计接口
    // window.electronAPI?.getStatistics().then(setStats).catch(() => {})
  }, [])

  const roleCount = useMemo(() => items.filter(i => i.type === "role").length, [items])
  const toolCount = useMemo(() => items.filter(i => i.type === "tool").length, [items])

  // 动态计算来源统计信息
  const sourceStats = useMemo(() => {
    const stats: Record<string, number> = {}
    items.forEach(item => {
      const source = item.source || "user"
      stats[source] = (stats[source] || 0) + 1
    })
    return stats
  }, [items])

  // 分享即下载（绑定到“查看/外链”图标）
  const handleView = async (item: ResourceItem) => {
    try {
      const res = await window.electronAPI?.invoke("resources:download", {
        id: item.id,
        type: item.type,
        source: item.source ?? "user"
      })
      if (res?.success) {
        toast.success(t("resources.messages.downloadSuccess", { path: res.path }))
      } else {
        toast.error(res?.message || t("resources.messages.downloadFailed"))
      }
    } catch (err) {
      toast.error(t("resources.messages.downloadFailed") + `：${String(err)}`)
    }
  }
  // 删除处理
  const handleDelete = async (item: ResourceItem) => {
    if ((item.source ?? "user") !== "user") {
      toast.error(t("resources.messages.deleteOnlyUser"))
      return
    }
    const typeText = t(`resources.types.${item.type}`)
    const ok = window.confirm(t("resources.messages.deleteConfirm", { type: typeText, name: item.name }))
    if (!ok) return

    try {
      const res = await window.electronAPI?.invoke("resources:delete", {
        id: item.id,
        type: item.type,
        source: item.source ?? "user"
      })
      if (res?.success) {
        // 更新本地列表
        const updatedItems = items.filter(i => !(i.id === item.id && i.type === item.type))
        setItems(updatedItems)

        // 重新计算统计信息

        toast.success(t("resources.messages.deleteSuccess"))
      } else {
        toast.error(res?.message || t("resources.messages.deleteFailed"))
      }
    } catch (err) {
      toast.error(t("resources.messages.deleteFailed") + `：${String(err)}`)
    }
  }

  // 编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null)

  // 编辑（弹窗）
  const handleEdit = async (item: ResourceItem) => {
    setEditingItem(item)
    setEditorOpen(true)
  }

  // 关闭编辑器
  const closeEditor = () => {
    setEditorOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input placeholder={t("resources.search.placeholder")} value={query} onChange={e => handleSearch(e.target.value)} className="max-w-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundPen className="h-4 w-4" />
              {t("resources.cards.roles.title")}
            </CardTitle>
            <CardDescription>{t("resources.cards.roles.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pickaxe className="h-4 w-4" />
              {t("resources.cards.tools.title")}
            </CardTitle>
            <CardDescription>{t("resources.cards.tools.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader className="pb-1 ">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("resources.cards.sources.title")}
            </CardTitle>
            <CardDescription>{t("resources.cards.sources.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-lg  font-bold text-muted-foreground">
              {Object.entries(sourceStats).map(([src, count]) => (
                <li key={src} className="flex justify-between">
                  <span>{src}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* 筛选栏放在网格上方 */}
      <div className="flex items-center gap-4 mb-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("resources.filters.type")}</span>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "all" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("all")}>
            {t("resources.filters.all")}
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "role" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("role")}>
            {t("resources.filters.roles")}
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "tool" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("tool")}>
            {t("resources.filters.tools")}
          </button>
        </div>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-muted" />

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("resources.filters.source")}</span>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "all" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("all")}>
            {t("resources.filters.all")}
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "system" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("system")}>
            {t("resources.filters.system")}
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "user" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("user")}>
            {t("resources.filters.user")}
          </button>
        </div>
      </div>

      {/* 原来的网格容器保持不变，只把 items.map 改为 filteredItems.map */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map(item => (
          <Card key={`${item.type}-${item.id}`} onClick={() => handleEdit(item)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
            <CardHeader className="p-4 ">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {item.type === "role" ? <UserRoundPen className="h-6 w-6" /> : <Pickaxe className="h-6 w-6" />}
                  {item.name}
                </span>
                <span className="flex items-center gap-3">
                  {/* 编辑 */}
                  <SquarePen className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-[#1f6feb]" onClick={() => handleEdit(item)} />
                  {/* 查看/外链 */}
                  <FolderDown className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-[#1f6feb]" onClick={() => handleView(item)} />
                  {/* 删除 */}
                  {item.source === "user" && <Trash className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-red-600" onClick={() => handleDelete(item)} />}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 mb-0">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              <div className="flex gap-4">
                <div className={`inline-flex items-center rounded-2xl px-2 py-1 text-sm ${item.type === "role" ? "bg-[#DDF4FF] text-[#1f6feb]" : "bg-[#FBEFFF] text-[#B472DF]"}`}>{t(`resources.types.${item.type}`)}</div>
                <div className={`inline-flex items-center rounded-2xl px-2 py-1 text-sm ${(item.source ?? "user") === "system" ? "bg-[#a8dafc] text-[#1063e0]" : "bg-[#D3F3DA] text-[#56A69C]"}`}>{item.source ?? "user"}</div>
                <span className="text-sm inline-flex items-center px-2 py-1 text-[#666]">ID: {item.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center py-4">
        <span className="text-sm text-muted-foreground">{t("resources.messages.noMore")}</span>
      </div>

      {/* 编辑器弹窗组件 */}
      <ResourceEditor isOpen={editorOpen} onClose={closeEditor} editingItem={editingItem} onResourceUpdated={loadResources} />

      <Toaster />
    </div>
  )
}
