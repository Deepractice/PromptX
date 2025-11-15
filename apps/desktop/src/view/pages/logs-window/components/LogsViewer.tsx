import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Trash, FileText, AlertCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type LogFile = {
  name: string
  path: string
  size: number
  modified: Date
  type: "error" | "normal"
}

export function LogsViewer() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogFile[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogFile[]>([])
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null)
  const [logContent, setLogContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "error" | "normal">("all")
  const [dateFilter, setDateFilter] = useState<Date | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, searchQuery, typeFilter, dateFilter])

  const loadLogs = async () => {
    try {
      const result = await window.electronAPI?.invoke("logs:list")
      if (result?.success) {
        const logsList = result.logs.map((log: any) => ({
          ...log,
          modified: new Date(log.modified)
        }))
        setLogs(logsList)
      } else {
        toast.error(t("logs.messages.loadFailed"))
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
      toast.error(t("logs.messages.loadFailed"))
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // 类型筛选
    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.type === typeFilter)
    }

    // 日期筛选
    if (dateFilter) {
      filtered = filtered.filter(log => {
        const logDate = log.modified.toISOString().split("T")[0]
        const filterDate = dateFilter.toISOString().split("T")[0]
        return logDate === filterDate
      })
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => log.name.toLowerCase().includes(query))
    }

    setFilteredLogs(filtered)
  }

  const viewLog = async (log: LogFile) => {
    setSelectedLog(log)
    setIsLoading(true)
    try {
      const result = await window.electronAPI?.invoke("logs:read", log.name)
      if (result?.success) {
        setLogContent(result.content)
      } else {
        toast.error(t("logs.messages.readFailed"))
        setLogContent("")
      }
    } catch (error) {
      console.error("Failed to read log:", error)
      toast.error(t("logs.messages.readFailed"))
      setLogContent("")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteLog = async (log: LogFile) => {
    if (!window.confirm(t("logs.messages.deleteConfirm", { name: log.name }))) {
      return
    }

    try {
      const result = await window.electronAPI?.invoke("logs:delete", log.name)
      if (result?.success) {
        toast.success(t("logs.messages.deleteSuccess"))
        if (selectedLog?.name === log.name) {
          setSelectedLog(null)
          setLogContent("")
        }
        loadLogs()
      } else {
        toast.error(t("logs.messages.deleteFailed"))
      }
    } catch (error) {
      console.error("Failed to delete log:", error)
      toast.error(t("logs.messages.deleteFailed"))
    }
  }

  const clearAllLogs = async () => {
    if (!window.confirm(t("logs.messages.clearAllConfirm"))) {
      return
    }

    try {
      const result = await window.electronAPI?.invoke("logs:clear")
      if (result?.success) {
        toast.success(t("logs.messages.clearSuccess", { count: result.deleted }))
        setSelectedLog(null)
        setLogContent("")
        loadLogs()
      } else {
        toast.error(t("logs.messages.clearFailed"))
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
      toast.error(t("logs.messages.clearFailed"))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  return (
    <div className="h-full flex flex-col min-h-[600px]">  
      <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
        {/* 筛选区域 */}
        <div className="flex flex-wrap gap-2 shrink-0 mt-4">
          {/* 搜索 */}
          <div className="flex-1 min-w-[180px] max-w-xs">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("logs.search.placeholder")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex gap-2 flex-wrap">
            <Button variant={typeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("all")}>
              {t("logs.filters.all")}
            </Button>
            <Button variant={typeFilter === "normal" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("normal")}>
              <FileText className="h-4 w-4 mr-1" />
              {t("logs.filters.normal")}
            </Button>
            <Button variant={typeFilter === "error" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("error")}>
              <AlertCircle className="h-4 w-4 mr-1" />
              {t("logs.filters.error")}
            </Button>
          </div>

          {/* 日期筛选 */}
          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker
              value={dateFilter}
              onChange={(date) => setDateFilter(date || null)}
              placeholder={t("datePicker.placeholder")}
              className="w-48"
            />
          </div>

          {/* 清空所有日志 */}
          <Button variant="destructive" size="sm" onClick={clearAllLogs} className="ml-auto">
            <Trash className="h-4 w-4 mr-1" />
            {t("logs.actions.clearAll")}
          </Button>
        </div>

        {/* 日志列表和内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* 日志列表 */}
          <div className="flex flex-col border rounded-md p-3 min-h-0">
            <div className="font-semibold text-sm mb-2 shrink-0">{t("logs.list.count", { count: filteredLogs.length })}</div>
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {filteredLogs.length === 0 && <div className="text-center text-muted-foreground py-8">{t("logs.list.empty")}</div>}
              {filteredLogs.map(log => (
                <div key={log.name} className={`p-3 border rounded cursor-pointer transition-colors ${selectedLog?.name === log.name ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"}`} onClick={() => viewLog(log)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {log.type === "error" ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0" /> : <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
                        <span className="font-mono text-sm truncate">{log.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatSize(log.size)} • {formatDate(log.modified)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        deleteLog(log)
                      }}
                      className="shrink-0 hover:text-red-500 "
                    >
                      <Trash className="h-4 w-4 "  />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 日志内容 */}
          <div className="flex flex-col border rounded-md p-3 bg-gray-50 min-h-0 overflow-hidden">
            {isLoading && <div className="text-center py-8">{t("logs.viewer.loading")}</div>}
            {!isLoading && !selectedLog && <div className="text-center text-muted-foreground py-8">{t("logs.viewer.selectPrompt")}</div>}
            {!isLoading && selectedLog && (
              <>
                <div className="font-semibold mb-2 shrink-0">{selectedLog.name}</div>
                <div className="flex-1 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word">{logContent || t("logs.viewer.empty")}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
