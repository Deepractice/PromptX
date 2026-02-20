
import { useEffect, useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast, Toaster } from "sonner"
import {
  Search,
  Loader2,
  Play,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  Pencil,
  Settings2,
  X,
} from "lucide-react"

type ToolItem = {
  id: string
  name: string
  description?: string
  type: "tool"
  source?: string
  manual?: string
  parameters?: any
  tags?: string[]
}

type SourceFilter = "all" | "system" | "plaza" | "user"

type ExecLogEntry = {
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

// 持久化执行日志到 localStorage
function getExecLogs(toolId: string): ExecLogEntry[] {
  try {
    const raw = localStorage.getItem(`tool-logs:${toolId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addExecLog(entry: ExecLogEntry) {
  const logs = getExecLogs(entry.toolId)
  logs.unshift(entry)
  // 最多保留 50 条
  if (logs.length > 50) logs.length = 50
  localStorage.setItem(`tool-logs:${entry.toolId}`, JSON.stringify(logs))
}

export default function ToolsPage() {
  const { t } = useTranslation()
  const [tools, setTools] = useState<ToolItem[]>([])
  const [query, setQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Test tab state
  const [execParams, setExecParams] = useState("{}")
  const [execResult, setExecResult] = useState<string | null>(null)
  const [execDuration, setExecDuration] = useState<number | null>(null)
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null)
  const [toolSchema, setToolSchema] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [paramMode, setParamMode] = useState<"form" | "json">("form")

  // Configure tab state
  const [toolFiles, setToolFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileLoading, setFileLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState<string>("")
  const [saving, setSaving] = useState(false)

  // Edit info dialog state
  const [showEditInfo, setShowEditInfo] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [savingInfo, setSavingInfo] = useState(false)

  // Logs tab state
  const [execLogs, setExecLogs] = useState<ExecLogEntry[]>([])

  // Manual/docs
  const [toolManual, setToolManual] = useState<string | null>(null)

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tools.filter((item) => {
      const src = item.source ?? "user"
      // "plaza" filter maps to backend "project" source
      const sourceOk = sourceFilter === "all" || src === (sourceFilter === "plaza" ? "project" : sourceFilter)
      const queryOk =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
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
        if (flat.length > 0 && !selectedTool) selectTool(flat[0] ?? null)
      } else {
        toast.error(t("tools.messages.loadFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const selectTool = useCallback((tool: ToolItem | null) => {
    setSelectedTool(tool)
    setExecResult(null)
    setExecDuration(null)
    setExecSuccess(null)
    setExecParams("{}")
    setToolManual(null)
    setToolFiles([])
    setSelectedFile(null)
    setFileContent("")
    setActiveTab("overview")
    setToolSchema(null)
    setFormValues({})
    if (tool) {
      setExecLogs(getExecLogs(tool.id))
      // Load tool manual in background
      window.electronAPI?.getToolManual(tool.id).then((res: any) => {
        if (res?.success && res.data) {
          setToolManual(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2))
        }
      }).catch(() => {})
      // Load tool schema in background
      window.electronAPI?.getToolSchema({ id: tool.id, source: tool.source ?? "user" }).then((res: any) => {
        if (res?.success && res.schema) {
          setToolSchema(res.schema)
          // 用 schema 的 required 字段初始化默认值
          const props = res.schema?.parameters?.properties || {}
          const defaults: Record<string, any> = {}
          Object.entries(props).forEach(([key, prop]: [string, any]) => {
            if (prop.enum && prop.enum.length > 0) defaults[key] = prop.enum[0]
            else if (prop.type === "number") defaults[key] = ""
            else if (prop.type === "boolean") defaults[key] = false
            else defaults[key] = ""
          })
          setFormValues(defaults)
        }
      }).catch(() => {})
      // Load tool files in background
      window.electronAPI?.invoke("resources:listFiles", {
        id: tool.id,
        type: "tool",
        source: tool.source ?? "user",
      }).then((res: any) => {
        if (res?.success && res.files) {
          setToolFiles(res.files)
        }
      }).catch(() => {})
    }
  }, [])

  const handleExecute = async () => {
    if (!selectedTool) return
    setExecuting(true)
    setExecResult(null)
    setExecDuration(null)
    setExecSuccess(null)

    try {
      let parsedParams: any = undefined

      if (paramMode === "form" && toolSchema) {
        // 从表单构建参数，过滤掉空值
        const built: Record<string, any> = {}
        const props = toolSchema?.parameters?.properties || {}
        Object.entries(formValues).forEach(([key, val]) => {
          if (val === "" || val === undefined || val === null) return
          const propDef = props[key] as any
          // 类型转换
          if (propDef?.type === "number" && typeof val === "string") {
            const n = Number(val)
            if (!isNaN(n)) built[key] = n
          } else if ((propDef?.type === "object" || propDef?.type === "array") && typeof val === "string") {
            try { built[key] = JSON.parse(val) } catch { built[key] = val }
          } else {
            built[key] = val
          }
        })
        if (Object.keys(built).length > 0) parsedParams = built
      } else {
        // JSON 模式
        if (execParams.trim() && execParams.trim() !== "{}") {
          try {
            parsedParams = JSON.parse(execParams)
          } catch {
            toast.error(t("tools.messages.invalidParams"))
            setExecuting(false)
            return
          }
        }
      }

      const startTime = Date.now()
      const result = await window.electronAPI?.executeTool(selectedTool.id, parsedParams)
      const duration = result?.duration || (Date.now() - startTime)

      setExecDuration(duration)

      if (result?.success) {
        const output = result.data
          ? typeof result.data === "string"
            ? result.data
            : JSON.stringify(result.data, null, 2)
          : t("tools.detail.execNoOutput")
        setExecResult(output)
        setExecSuccess(true)
        toast.success(t("tools.messages.executeSuccess", { name: selectedTool.name }))

        // Log execution
        const entry: ExecLogEntry = {
          toolId: selectedTool.id,
          timestamp: Date.now(),
          duration,
          success: true,
          params: execParams.trim() !== "{}" ? execParams : undefined,
          result: output.substring(0, 500),
        }
        addExecLog(entry)
        setExecLogs(getExecLogs(selectedTool.id))
      } else {
        const errMsg = result?.message || t("tools.messages.executeFailed")
        setExecResult(errMsg)
        setExecSuccess(false)
        toast.error(errMsg)

        const entry: ExecLogEntry = {
          toolId: selectedTool.id,
          timestamp: Date.now(),
          duration,
          success: false,
          params: execParams.trim() !== "{}" ? execParams : undefined,
          error: errMsg,
        }
        addExecLog(entry)
        setExecLogs(getExecLogs(selectedTool.id))
      }
    } catch (e: any) {
      const errMsg = e?.message || t("tools.messages.executeFailed")
      setExecResult(errMsg)
      setExecSuccess(false)
      toast.error(errMsg)
    } finally {
      setExecuting(false)
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
        id: tool.id,
        type: "tool",
        source: tool.source ?? "user",
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

  const loadFileContent = async (filePath: string) => {
    if (!selectedTool) return
    setFileLoading(true)
    setSelectedFile(filePath)
    try {
      const res = await window.electronAPI?.invoke("resources:readFile", {
        id: selectedTool.id,
        type: "tool",
        source: selectedTool.source ?? "user",
        relativePath: filePath,
      })
      if (res?.success) {
        setFileContent(res.content || "")
      } else {
        setFileContent(`// Error: ${res?.message || "Failed to read file"}`)
      }
    } catch (e: any) {
      setFileContent(`// Error: ${e?.message || "Failed to read file"}`)
    } finally {
      setFileLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedTool || !selectedFile) return
    setSaving(true)
    try {
      const res = await window.electronAPI?.invoke("resources:saveFile", {
        id: selectedTool.id,
        type: "tool",
        source: selectedTool.source ?? "user",
        relativePath: selectedFile,
        content: editContent,
      })
      if (res?.success) {
        setFileContent(editContent)
        setIsEditing(false)
        toast.success(t("tools.messages.saveSuccess"))
      } else {
        toast.error(res?.message || t("tools.messages.saveFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateInfo = async () => {
    if (!selectedTool) return
    if ((selectedTool.source ?? "user") !== "user") {
      toast.error(t("tools.messages.updateOnlyUser"))
      return
    }
    setSavingInfo(true)
    try {
      const res = await window.electronAPI?.invoke("resources:updateMetadata", {
        id: selectedTool.id,
        type: "tool",
        source: selectedTool.source ?? "user",
        name: editName.trim(),
        description: editDescription.trim(),
      })
      if (res?.success) {
        toast.success(t("tools.messages.updateSuccess"))
        setShowEditInfo(false)
        // Update local state
        setSelectedTool({ ...selectedTool, name: editName.trim(), description: editDescription.trim() })
        loadTools()
      } else {
        toast.error(res?.message || t("tools.messages.updateFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.updateFailed"))
    } finally {
      setSavingInfo(false)
    }
  }

  useEffect(() => {
    loadTools()
  }, [])

  return (
    <div className="flex h-full">
      <Toaster />
      {/* Left Panel - Tool List */}
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
          {/* Source filter buttons */}
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
            {loading && tools.length === 0 ? (
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
                  onClick={() => selectTool(tool)}
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

      {/* Right Panel - Tool Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTool ? (
          <>
            {/* Detail Header */}
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
                        selectedTool.source === "system"
                          ? "bg-blue-100 text-blue-700"
                          : selectedTool.source === "project"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {t(`tools.filters.${selectedTool.source === "project" ? "plaza" : (selectedTool.source ?? "user")}`)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTool.source ?? "user"} / {selectedTool.id}
                    </p>
                  </div>
                </div>
                {(selectedTool.source ?? "user") === "user" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditName(selectedTool.name)
                        setEditDescription(selectedTool.description || "")
                        setShowEditInfo(true)
                      }}
                    >
                      <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                      {t("tools.detail.editInfo")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(selectedTool)}
                    >
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
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2"
                      >
                        {t(`tools.detail.${tab}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6 mt-0 flex-1 overflow-auto">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-medium mb-2">{t("tools.detail.description")}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedTool.description || t("tools.noDescription")}
                      </p>
                    </div>
                    {selectedTool.tags && selectedTool.tags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">{t("tools.detail.tags")}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTool.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {toolManual && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">{t("tools.detail.manual")}</h3>
                        <div className="rounded-lg bg-muted/50 p-4">
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {toolManual}
                          </pre>
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium mb-2">{t("tools.detail.info")}</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border p-3">
                          <span className="text-muted-foreground">{t("tools.detail.source")}</span>
                          <p className="font-medium mt-0.5">{selectedTool.source ?? "user"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <span className="text-muted-foreground">ID</span>
                          <p className="font-medium mt-0.5 font-mono text-xs">{selectedTool.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Test Tab */}
                <TabsContent value="test" className="flex-1 flex flex-col mt-0">
                  <div className="flex-1 flex flex-col p-6 gap-4">
                    {/* Execution info bar */}
                    {execSuccess !== null && (
                      <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                        execSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {execSuccess ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>{execSuccess ? t("tools.detail.execSuccess") : t("tools.detail.execFailed")}</span>
                        {execDuration !== null && (
                          <span className="ml-auto flex items-center gap-1 text-xs opacity-70">
                            <Clock className="h-3 w-3" />
                            {execDuration}ms
                          </span>
                        )}
                      </div>
                    )}

                    {/* Parameters Editor */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">{t("tools.detail.parameters")}</h3>
                        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                          <button
                            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${paramMode === "form" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
                            onClick={() => setParamMode("form")}
                          >
                            {t("tools.detail.formMode")}
                          </button>
                          <button
                            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${paramMode === "json" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
                            onClick={() => setParamMode("json")}
                          >
                            JSON
                          </button>
                        </div>
                      </div>

                      {paramMode === "form" && toolSchema?.parameters?.properties ? (
                        <div className="rounded-lg border p-4 space-y-3 max-h-[260px] overflow-auto">
                          {Object.entries(toolSchema.parameters.properties as Record<string, any>).map(([key, prop]) => {
                            const required = (toolSchema.parameters.required || []).includes(key)
                            return (
                              <div key={key}>
                                <label className="flex items-center gap-1 text-xs font-medium mb-1">
                                  {key}
                                  {required && <span className="text-red-500">*</span>}
                                </label>
                                {prop.enum ? (
                                  <select
                                    value={formValues[key] ?? ""}
                                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm"
                                  >
                                    {prop.enum.map((v: string) => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                ) : prop.type === "boolean" ? (
                                  <input
                                    type="checkbox"
                                    checked={!!formValues[key]}
                                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.checked }))}
                                    className="rounded border"
                                  />
                                ) : prop.type === "number" ? (
                                  <Input
                                    type="number"
                                    value={formValues[key] ?? ""}
                                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={prop.description || key}
                                    className="h-8 text-sm"
                                  />
                                ) : prop.type === "object" || prop.type === "array" ? (
                                  <textarea
                                    value={formValues[key] ?? ""}
                                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={prop.description || "JSON..."}
                                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm font-mono min-h-[60px] resize-y"
                                    spellCheck={false}
                                  />
                                ) : (
                                  <Input
                                    value={formValues[key] ?? ""}
                                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={prop.description || key}
                                    className="h-8 text-sm"
                                  />
                                )}
                                {prop.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{prop.description}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-[#1e1e2e] p-4 min-h-[100px] max-h-[200px] overflow-auto">
                          <textarea
                            value={execParams}
                            onChange={(e) => setExecParams(e.target.value)}
                            className="w-full h-full min-h-[80px] bg-transparent text-green-400 font-mono text-sm resize-none outline-none"
                            spellCheck={false}
                            placeholder='{"key": "value"}'
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{t("tools.detail.paramsHint")}</p>
                    </div>

                    {/* Output Panel */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <h3 className="text-sm font-medium mb-2">{t("tools.detail.output")}</h3>
                      <div className="flex-1 rounded-lg bg-[#1e1e2e] p-4 min-h-[120px] overflow-auto">
                        {executing ? (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{t("tools.detail.executing")}</span>
                          </div>
                        ) : (
                          <pre className={`text-sm font-mono whitespace-pre-wrap ${
                            execSuccess === false ? "text-red-400" : "text-gray-300"
                          }`}>
                            {execResult || t("tools.detail.outputEmpty")}
                          </pre>
                        )}
                      </div>
                    </div>

                    {/* Run Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleExecute}
                        disabled={executing}
                        className="bg-foreground text-background hover:bg-foreground/90"
                      >
                        {executing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {t("tools.detail.runTest")}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Configure Tab */}
                <TabsContent value="configure" className="p-6 mt-0 flex-1 flex flex-col overflow-hidden">
                  <div className="flex flex-col flex-1 gap-5 min-h-0">
                    {/* Tool files */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">{t("tools.detail.toolFiles")}</h3>
                      {toolFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("tools.detail.noFiles")}</p>
                      ) : (
                        <div className="space-y-1">
                          {toolFiles.map((file) => (
                            <button
                              key={file}
                              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                selectedFile === file
                                  ? "bg-accent border border-border"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => loadFileContent(file)}
                            >
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate font-mono text-xs">{file}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* File content viewer / editor */}
                    {selectedFile && (
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium font-mono">{selectedFile}</h3>
                          <div className="flex items-center gap-2">
                            {(selectedTool.source ?? "user") === "user" ? (
                              isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setIsEditing(false)}
                                  >
                                    {t("tools.detail.cancel")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
                                    onClick={handleSaveFile}
                                    disabled={saving}
                                  >
                                    {saving ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Save className="h-3 w-3 mr-1" />
                                    )}
                                    {t("tools.detail.save")}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => { setEditContent(fileContent); setIsEditing(true) }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  {t("tools.detail.edit")}
                                </Button>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("tools.detail.readOnly")}</span>
                            )}
                          </div>
                        </div>
                        <div className={`flex-1 rounded-lg bg-[#1e1e2e] ${isEditing ? "flex flex-col overflow-hidden" : "p-4 overflow-auto"}`}>
                          {fileLoading ? (
                            <div className="flex items-center gap-2 text-gray-400 p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">{t("tools.detail.loadingFile")}</span>
                            </div>
                          ) : isEditing ? (
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full flex-1 bg-transparent text-green-400 font-mono text-sm resize-none outline-none p-4"
                              spellCheck={false}
                            />
                          ) : (
                            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                              {fileContent}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parameters schema */}
                    {selectedTool.parameters && (
                      <div className="shrink-0 max-h-[200px] overflow-auto">
                        <h3 className="text-sm font-medium mb-2">{t("tools.detail.paramSchema")}</h3>
                        <div className="rounded-lg bg-muted/50 p-4">
                          <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                            {typeof selectedTool.parameters === "string"
                              ? selectedTool.parameters
                              : JSON.stringify(selectedTool.parameters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs" className="p-6 mt-0 flex-1 overflow-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {t("tools.detail.execHistory")}
                        <span className="ml-2 text-muted-foreground font-normal">({execLogs.length})</span>
                      </h3>
                      {execLogs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            localStorage.removeItem(`tool-logs:${selectedTool.id}`)
                            setExecLogs([])
                          }}
                        >
                          {t("tools.detail.clearLogs")}
                        </Button>
                      )}
                    </div>
                    {execLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">{t("tools.detail.noLogs")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {execLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border p-3 text-sm ${
                              log.success ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {log.success ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                                )}
                                <span className="font-medium">
                                  {log.success ? t("tools.detail.execSuccess") : t("tools.detail.execFailed")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {log.duration}ms
                                </span>
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            {log.params && (
                              <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
                                params: {log.params}
                              </div>
                            )}
                            {log.error && (
                              <div className="mt-1 text-xs text-red-600 font-mono truncate">
                                {log.error}
                              </div>
                            )}
                            {log.result && (
                              <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
                                {log.result.substring(0, 200)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">{t("tools.detail.selectTool")}</p>
          </div>
        )}
      </div>

      {/* Edit Info Dialog */}
      {showEditInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-xl w-[420px] border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">{t("tools.detail.editInfo")}</h3>
              <button onClick={() => setShowEditInfo(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">{t("tools.detail.editName")}</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("tools.detail.namePlaceholder")}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{t("tools.detail.editDescription")}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t("tools.detail.descriptionPlaceholder")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] resize-y outline-none focus:ring-1 focus:ring-ring"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowEditInfo(false)}>
                {t("tools.detail.cancel")}
              </Button>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={handleUpdateInfo}
                disabled={savingInfo || !editName.trim()}
              >
                {savingInfo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                {t("tools.detail.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
