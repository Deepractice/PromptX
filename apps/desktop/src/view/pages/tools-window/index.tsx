import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast, Toaster } from "sonner"
import ToolListPanel from "./components/ToolListPanel"
import ToolDetailPanel from "./components/ToolDetailPanel"
import type { ToolItem, SourceFilter } from "./components/ToolListPanel"

export default function ToolsPage() {
  const { t } = useTranslation()
  const [tools, setTools] = useState<ToolItem[]>([])
  const [query, setQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [loading, setLoading] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null)

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tools.filter((item) => {
      const src = item.source ?? "user"
      const sourceOk = sourceFilter === "all" || src === (sourceFilter === "plaza" ? "project" : sourceFilter)
      const queryOk = q === "" || item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false)
      return sourceOk && queryOk
    })
  }, [tools, sourceFilter, query])

  const sourceStats = useMemo(() => {
    const stats = { system: 0, plaza: 0, user: 0 }
    tools.forEach((t) => {
      const src = t.source ?? "user"
      if (src === "project") stats.plaza++
      else if (src in stats) stats[src as keyof typeof stats]++
    })
    return stats
  }, [tools])

  const loadTools = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI?.getGroupedResources()
      if (result?.success) {
        const { grouped } = result.data || {}
        const flat: ToolItem[] = []
        Object.keys(grouped || {}).forEach((source) => {
          const group = grouped[source] || {}
          ;(group.tools || []).forEach((tool: any) =>
            flat.push({
              id: tool.id || tool.name,
              name: tool.name,
              description: tool.description,
              type: "tool",
              source,
              manual: tool.manual,
              parameters: tool.parameters,
              tags: tool.tags || [],
            })
          )
        })
        setTools(flat)
        if (flat.length > 0 && !selectedTool) setSelectedTool(flat[0] ?? null)
      } else {
        toast.error(t("tools.messages.loadFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tool: ToolItem) => {
    if ((tool.source ?? "user") !== "user") {
      toast.error(t("tools.messages.deleteOnlyUser"))
      return
    }
    const ok = window.confirm(t("tools.messages.deleteConfirm", { name: tool.name }))
    if (!ok) return
    try {
      const res = await window.electronAPI?.invoke("resources:delete", {
        id: tool.id, type: "tool", source: tool.source ?? "user",
      })
      if (res?.success) {
        toast.success(t("tools.messages.deleteSuccess", { name: tool.name }))
        if (selectedTool?.id === tool.id) setSelectedTool(null)
        loadTools()
      } else {
        toast.error(res?.message || t("tools.messages.deleteFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.deleteFailed"))
    }
  }

  useEffect(() => {
    loadTools()
  }, [])

  return (
    <div className="flex h-full">
      <Toaster />
      <ToolListPanel
        loading={loading}
        filteredTools={filteredTools}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        sourceStats={sourceStats}
        query={query}
        setQuery={setQuery}
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
      />
      <ToolDetailPanel
        selectedTool={selectedTool}
        onToolUpdated={setSelectedTool}
        onDelete={handleDelete}
        onReload={loadTools}
      />
    </div>
  )
}
