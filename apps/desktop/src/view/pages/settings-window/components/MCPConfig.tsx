import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Pencil, Server, Loader2, Lock } from "lucide-react"

interface MCPServerConfig {
  name: string
  // stdio 类型
  command?: string
  args?: string[]
  env?: Record<string, string>
  // http/sse 类型
  type?: "http" | "sse"
  url?: string
  // 通用
  enabled: boolean
  builtin?: boolean
  description?: string
  [key: string]: unknown
}

// 从服务器配置生成 JSON 字符串（排除 name, enabled, builtin, description）
function configToJson(config: MCPServerConfig): string {
  const { name, enabled, builtin, description, ...rest } = config
  return JSON.stringify(rest, null, 2)
}

// 从 JSON 字符串解析配置
function jsonToConfig(name: string, json: string, enabled: boolean): MCPServerConfig | null {
  try {
    const parsed = JSON.parse(json)
    // 支持 stdio (command) 或 http/sse (type + url)
    if (!parsed.command && !parsed.url) {
      return null
    }
    return {
      name,
      enabled,
      ...parsed,
    }
  } catch {
    return null
  }
}

// 默认 JSON 模板
const DEFAULT_JSON_TEMPLATE = `{
  "command": "node",
  "args": ["/path/to/server.js"]
}`

// 示例模板
const EXAMPLE_TEMPLATES = {
  stdio: `{
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-server-filesystem", "/path/to/dir"]
}`,
  http: `{
  "type": "http",
  "url": "http://127.0.0.1:5277/mcp"
}`,
  sse: `{
  "type": "sse",
  "url": "http://127.0.0.1:5277/sse"
}`
}

export function MCPConfig() {
  const { t } = useTranslation()
  const [servers, setServers] = useState<MCPServerConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [serverName, setServerName] = useState("")
  const [serverEnabled, setServerEnabled] = useState(true)
  const [jsonConfig, setJsonConfig] = useState(DEFAULT_JSON_TEMPLATE)
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      const data = await window.electronAPI?.agentx.getMcpServers()
      setServers(data || [])
    } catch (error) {
      console.error("Failed to load MCP servers:", error)
      toast.error(t("settings.mcp.loadError"))
    } finally {
      setIsLoading(false)
    }
  }

  const saveServers = async (newServers: MCPServerConfig[]) => {
    setIsSaving(true)
    try {
      const result = await window.electronAPI?.agentx.updateMcpServers(newServers)
      if (result?.success) {
        setServers(newServers)
        toast.success(t("settings.mcp.saveSuccess"))
      } else {
        toast.error(result?.error || t("settings.mcp.saveFailed"))
      }
    } catch (error) {
      toast.error(String(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdd = () => {
    setEditingIndex(null)
    setServerName("")
    setServerEnabled(true)
    setJsonConfig(DEFAULT_JSON_TEMPLATE)
    setJsonError(null)
    setDialogOpen(true)
  }

  const handleEdit = (index: number) => {
    const server = servers[index]
    setEditingIndex(index)
    setServerName(server.name)
    setServerEnabled(server.enabled)
    setJsonConfig(configToJson(server))
    setJsonError(null)
    setDialogOpen(true)
  }

  const handleDelete = async (index: number) => {
    const server = servers[index]
    if (server.builtin) {
      toast.error(t("settings.mcp.cannotDeleteBuiltin"))
      return
    }
    const newServers = servers.filter((_, i) => i !== index)
    await saveServers(newServers)
  }

  const handleToggle = async (index: number, enabled: boolean) => {
    const server = servers[index]
    if (server.builtin) {
      toast.error(t("settings.mcp.cannotDisableBuiltin"))
      return
    }
    const newServers = [...servers]
    newServers[index] = { ...newServers[index], enabled }
    await saveServers(newServers)
  }

  const validateJson = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      // 支持两种类型：stdio (command) 或 http/sse (type + url)
      if (!parsed.command && !parsed.url) {
        setJsonError(t("settings.mcp.validation.commandOrUrlRequired"))
        return false
      }
      if (parsed.url && !parsed.type) {
        setJsonError(t("settings.mcp.validation.typeRequired"))
        return false
      }
      setJsonError(null)
      return true
    } catch (e) {
      setJsonError(t("settings.mcp.validation.invalidJson"))
      return false
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonConfig(value)
    if (value.trim()) {
      validateJson(value)
    } else {
      setJsonError(null)
    }
  }

  const handleSave = async () => {
    if (!serverName.trim()) {
      toast.error(t("settings.mcp.validation.nameRequired"))
      return
    }

    if (!validateJson(jsonConfig)) {
      return
    }

    const serverData = jsonToConfig(serverName.trim(), jsonConfig, serverEnabled)
    if (!serverData) {
      toast.error(t("settings.mcp.validation.invalidConfig"))
      return
    }

    let newServers: MCPServerConfig[]
    if (editingIndex !== null) {
      newServers = [...servers]
      newServers[editingIndex] = serverData
    } else {
      // Check for duplicate name
      if (servers.some(s => s.name === serverData.name)) {
        toast.error(t("settings.mcp.validation.duplicate"))
        return
      }
      newServers = [...servers, serverData]
    }

    await saveServers(newServers)
    setDialogOpen(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.mcp.title")}</CardTitle>
          <CardDescription>{t("settings.mcp.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("settings.mcp.title")}</CardTitle>
              <CardDescription>{t("settings.mcp.description")}</CardDescription>
            </div>
            <Button onClick={handleAdd} size="sm" disabled={isSaving}>
              <Plus className="h-4 w-4 mr-1" />
              {t("settings.mcp.add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("settings.mcp.empty")}</p>
              <p className="text-sm mt-2">{t("settings.mcp.emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border bg-card ${server.builtin ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {server.builtin ? (
                      <div className="w-9 h-5 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={(checked) => handleToggle(index, checked)}
                        disabled={isSaving}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{server.name}</p>
                        {server.builtin && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {t("settings.mcp.builtin")}
                          </span>
                        )}
                      </div>
                      {server.description && (
                        <p className="text-sm text-muted-foreground">{server.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 font-mono truncate">
                        {server.type
                          ? `${server.type}: ${server.url}`
                          : `${server.command} ${server.args?.join(" ") || ""}`
                        }
                      </p>
                    </div>
                  </div>
                  {!server.builtin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(index)}
                        disabled={isSaving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? t("settings.mcp.edit") : t("settings.mcp.add")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.mcp.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mcp-name">{t("settings.mcp.fields.name")}</Label>
              <Input
                id="mcp-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder={t("settings.mcp.fields.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcp-json">{t("settings.mcp.fields.config")}</Label>
              <Textarea
                id="mcp-json"
                value={jsonConfig}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={DEFAULT_JSON_TEMPLATE}
                className={`font-mono text-sm min-h-[200px] ${jsonError ? 'border-destructive' : ''}`}
              />
              {jsonError && (
                <p className="text-xs text-destructive">{jsonError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("settings.mcp.fields.configHint")}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="mcp-enabled"
                checked={serverEnabled}
                onCheckedChange={setServerEnabled}
              />
              <Label htmlFor="mcp-enabled">{t("settings.mcp.fields.enabled")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("settings.mcp.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !!jsonError}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.mcp.saving")}
                </>
              ) : (
                t("settings.mcp.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
