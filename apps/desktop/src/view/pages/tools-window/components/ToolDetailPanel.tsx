import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Trash2, Settings2, Download } from "lucide-react"
import EditInfoDialog from "./EditInfoDialog"
import ToolOverviewTab from "./ToolOverviewTab"
import ToolTestTab from "./ToolTestTab"
import ToolConfigureTab from "./ToolConfigureTab"
import ToolLogsTab from "./ToolLogsTab"
import type { ToolItem } from "./ToolListPanel"

export type ExecLogEntry = {
  toolId: string
  timestamp: number
  duration: number
  success: boolean
  params?: string
  result?: string
  error?: string
}

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

function getExecLogs(toolId: string): ExecLogEntry[] {
  try {
    const raw = localStorage.getItem(`tool-logs:${toolId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addExecLog(entry: ExecLogEntry) {
  const logs = getExecLogs(entry.toolId)
  logs.unshift(entry)
  if (logs.length > 50) logs.length = 50
  localStorage.setItem(`tool-logs:${entry.toolId}`, JSON.stringify(logs))
}

type Props = {
  selectedTool: ToolItem | null
  onToolUpdated: (tool: ToolItem) => void
  onDelete: (tool: ToolItem) => void
  onReload: () => void
}

export default function ToolDetailPanel({ selectedTool, onToolUpdated, onDelete, onReload }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [showEditInfo, setShowEditInfo] = useState(false)
  const [execLogs, setExecLogs] = useState<ExecLogEntry[]>([])
  const [toolManual, setToolManual] = useState<string | null>(null)
  const [toolSchema, setToolSchema] = useState<any>(null)

  const resetState = useCallback(() => {
    setToolManual(null)
    setActiveTab("overview")
    setToolSchema(null)
  }, [])

  useEffect(() => {
    if (!selectedTool) return
    resetState()
    setExecLogs(getExecLogs(selectedTool.id))

    window.electronAPI?.getToolManual(selectedTool.id).then((res: any) => {
      if (res?.success && res.data) {
        setToolManual(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2))
      }
    }).catch(() => {})

    window.electronAPI?.getToolSchema({ id: selectedTool.id, source: selectedTool.source ?? "user" }).then((res: any) => {
      if (res?.success && res.schema) setToolSchema(res.schema)
    }).catch(() => {})
  }, [selectedTool?.id, selectedTool?.source])

  const handleLogAdded = useCallback((entry: ExecLogEntry) => {
    addExecLog(entry)
    setExecLogs(getExecLogs(entry.toolId))
  }, [])

  const handleClearLogs = useCallback(() => {
    if (!selectedTool) return
    localStorage.removeItem(`tool-logs:${selectedTool.id}`)
    setExecLogs([])
  }, [selectedTool])

  const handleUpdateInfo = async (name: string, description: string) => {
    if (!selectedTool) return
    try {
      const res = await window.electronAPI?.invoke("resources:updateMetadata", {
        id: selectedTool.id, type: "tool", source: selectedTool.source ?? "user", name, description,
      })
      if (res?.success) {
        toast.success(t("tools.messages.updateSuccess"))
        setShowEditInfo(false)
        onToolUpdated({ ...selectedTool, name, description })
        onReload()
      } else {
        toast.error(res?.message || t("tools.messages.updateFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.updateFailed"))
    }
  }

  if (!selectedTool) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("tools.detail.selectTool")}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(selectedTool.name)} text-white text-lg font-bold`}>
              {getInitial(selectedTool.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedTool.name}</h2>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  selectedTool.source === "system" ? "bg-blue-100 text-blue-700"
                    : selectedTool.source === "project" ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {t(`tools.filters.${selectedTool.source === "project" ? "plaza" : (selectedTool.source ?? "user")}`)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedTool.source ?? "user"} / {selectedTool.id}</p>
            </div>
          </div>
          {(selectedTool.source ?? "user") === "user" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const result = await window.electronAPI?.invoke("resources:download", { id: selectedTool.id, type: "tool", source: selectedTool.source ?? "user" })
                  if (result?.success) {
                    toast.success(t("resources.actions.exportSuccess"))
                  } else if (result?.message) {
                    toast.error(result.message)
                  }
                } catch {
                  toast.error(t("resources.actions.exportFailed"))
                }
              }}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {t("resources.actions.export")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEditInfo(true)}>
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                {t("tools.detail.editInfo")}
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(selectedTool)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {t("tools.detail.deleteTool")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-10 bg-transparent p-0 gap-4">
              {(["overview", "test", "configure", "logs"] as const).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                  {t(`tools.detail.${tab}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 mt-0 flex-1 overflow-auto">
            <ToolOverviewTab tool={selectedTool} toolManual={toolManual} />
          </TabsContent>

          <TabsContent value="test" className="flex-1 flex flex-col mt-0">
            <ToolTestTab tool={selectedTool} toolSchema={toolSchema} onLogAdded={handleLogAdded} />
          </TabsContent>

          <TabsContent value="configure" className="p-6 mt-0 flex-1 flex flex-col overflow-hidden">
            <ToolConfigureTab tool={selectedTool} />
          </TabsContent>

          <TabsContent value="logs" className="p-6 mt-0 flex-1 overflow-auto">
            <ToolLogsTab toolId={selectedTool.id} logs={execLogs} onClear={handleClearLogs} />
          </TabsContent>
        </Tabs>
      </div>

      {showEditInfo && (
        <EditInfoDialog
          name={selectedTool.name}
          description={selectedTool.description || ""}
          onClose={() => setShowEditInfo(false)}
          onSave={handleUpdateInfo}
        />
      )}
    </div>
  )
}

