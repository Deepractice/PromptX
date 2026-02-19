import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast, Toaster } from "sonner"
import { LanguageSelector } from "./components/LanguageSelector"
import { MCPConfig } from "./components/MCPConfig"
import { SkillsConfig } from "./components/SkillsConfig"
import { Loader2, CheckCircle2, XCircle, Settings, Bot, RefreshCw } from "lucide-react"

interface ServerConfig {
  host: string
  port: number
  debug: boolean
}

interface AgentXConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface StatusMessage {
  type: "success" | "error" | null
  message: string
}

function SettingsWindow() {
  const { t } = useTranslation()
  const [autoStart, setAutoStart] = useState(false)
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    host: "127.0.0.1",
    port: 5203,
    debug: false
  })
  const [agentXConfig, setAgentXConfig] = useState<AgentXConfig>({
    apiKey: "",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-20250514"
  })
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({ type: null, message: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [isSavingAgentX, setIsSavingAgentX] = useState(false)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  // 加载当前设置状态
  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (!statusMessage?.type) return
    if (statusMessage.type === "success") {
      toast.success(statusMessage.message)
    } else if (statusMessage.type === "error") {
      toast.error(statusMessage.message)
    } else {
      toast(statusMessage.message)
    }
  }, [statusMessage])

  const loadSettings = async () => {
    try {
      const autoStartEnabled = await window.electronAPI?.invoke("auto-start:status")
      setAutoStart(autoStartEnabled || false)

      const config = await window.electronAPI?.invoke("server-config:get")
      if (config) {
        setServerConfig(config)
      }

      const agentxConfig = await window.electronAPI?.agentx.getConfig()
      if (agentxConfig) {
        setAgentXConfig(agentxConfig)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      showMessage("error", t("messages.loadError"))
    }
  }

  const showMessage = (type: "success" | "error", message: string) => {
    setStatusMessage({ type, message })
    setTimeout(() => {
      setStatusMessage({ type: null, message: "" })
    }, 3000)
  }

  const handleAutoStartToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await window.electronAPI?.invoke("auto-start:enable")
        showMessage("success", t("messages.autoStartEnabled"))
      } else {
        await window.electronAPI?.invoke("auto-start:disable")
        showMessage("success", t("messages.autoStartDisabled"))
      }
      setAutoStart(enabled)
    } catch (error) {
      console.error("Failed to toggle auto-start:", error)
      showMessage("error", t("messages.autoStartError"))
    }
  }

  const handleServerConfigChange = (field: keyof ServerConfig, value: string | number | boolean) => {
    setServerConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      await window.electronAPI?.invoke("server-config:update", serverConfig)
      showMessage("success", t("messages.configSaved"))
      // 显示重启确认弹窗
      setShowRestartDialog(true)
    } catch (error) {
      console.error("Failed to save config:", error)
      showMessage("error", t("messages.configSaveError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetConfig = async () => {
    try {
      const defaultConfig = {
        host: "127.0.0.1",
        port: 5203,
        debug: false
      }
      setServerConfig(defaultConfig)
      await window.electronAPI?.invoke("server-config:reset", defaultConfig)
      showMessage("success", t("messages.configReset"))
      // 显示重启确认弹窗
      setShowRestartDialog(true)
    } catch (error) {
      console.error("Failed to reset config:", error)
      showMessage("error", t("messages.configResetError"))
    }
  }

  const handleRestart = async () => {
    try {
      await window.electronAPI?.invoke("app:relaunch")
    } catch (error) {
      console.error("Failed to restart app:", error)
      showMessage("error", t("messages.restartError"))
    }
  }

  const handleAgentXConfigChange = (field: keyof AgentXConfig, value: string) => {
    setAgentXConfig(prev => ({ ...prev, [field]: value }))
    setConnectionStatus("idle")
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus("idle")
    try {
      const result = await window.electronAPI?.agentx.testConnection(agentXConfig)
      if (result?.success) {
        setConnectionStatus("success")
        showMessage("success", t("settings.agentx.testSuccess"))
      } else {
        setConnectionStatus("error")
        showMessage("error", result?.error || t("settings.agentx.testFailed"))
      }
    } catch (error) {
      setConnectionStatus("error")
      showMessage("error", String(error))
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveAgentXConfig = async () => {
    setIsSavingAgentX(true)
    try {
      const result = await window.electronAPI?.agentx.updateConfig(agentXConfig)
      if (result?.success) {
        showMessage("success", t("settings.agentx.saveSuccess"))
      } else {
        showMessage("error", result?.error || t("settings.agentx.saveFailed"))
      }
    } catch (error) {
      showMessage("error", String(error))
    } finally {
      setIsSavingAgentX(false)
    }
  }

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true)
    try {
      await window.electronAPI?.invoke("check-for-updates")
      showMessage("success", t("update.checking"))
    } catch (error) {
      showMessage("error", t("update.checkFailed"))
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-53px)] p-6 flex flex-col">
      <Toaster />
      <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col">
        <Tabs defaultValue="system" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t("settings.tabs.system")}
            </TabsTrigger>
            <TabsTrigger value="agentx" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              {t("settings.tabs.agentx")}
            </TabsTrigger>
          </TabsList>

          {/* 系统设置 */}
          <TabsContent value="system" className="flex-1 overflow-y-auto space-y-6">
            {/* 语言设置 */}
            <LanguageSelector />

            {/* 自启动设置 */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.autoStart.title")}</CardTitle>
                <CardDescription>{t("settings.autoStart.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-start" checked={autoStart} onCheckedChange={handleAutoStartToggle} />
                  <Label htmlFor="auto-start">{t("settings.autoStart.enable")}</Label>
                </div>
              </CardContent>
            </Card>

            {/* 服务器配置 */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.server.title")}</CardTitle>
                <CardDescription>{t("settings.server.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="server-host">{t("settings.server.host.label")}</Label>
                  <Input
                    id="server-host"
                    type="text"
                    placeholder={t("settings.server.host.placeholder")}
                    value={serverConfig.host}
                    onChange={e => handleServerConfigChange("host", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{t("settings.server.host.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server-port">{t("settings.server.port.label")}</Label>
                  <Input
                    id="server-port"
                    type="number"
                    min="1"
                    max="65535"
                    placeholder={t("settings.server.port.placeholder")}
                    value={serverConfig.port}
                    onChange={e => handleServerConfigChange("port", parseInt(e.target.value) || 5203)}
                  />
                  <p className="text-sm text-muted-foreground">{t("settings.server.port.description")}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="debug-mode"
                      checked={serverConfig.debug}
                      onCheckedChange={checked => handleServerConfigChange("debug", checked)}
                    />
                    <Label htmlFor="debug-mode">{t("settings.server.debug.label")}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("settings.server.debug.description")}</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleSaveConfig} disabled={isLoading}>
                    {isLoading ? t("settings.server.saving") : t("settings.server.save")}
                  </Button>
                  <Button variant="outline" onClick={handleResetConfig} disabled={isLoading}>
                    {t("settings.server.reset")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 检查更新 */}
            <Card>
              <CardHeader>
                <CardTitle>{t("update.title")}</CardTitle>
                <CardDescription>{t("update.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  variant="outline"
                >
                  {isCheckingUpdate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("update.checking")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t("update.checkNow")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AgentX 设置 */}
          <TabsContent value="agentx" className="flex-1 overflow-y-auto space-y-6">
            {/* API 配置 */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.agentx.title")}</CardTitle>
                <CardDescription>{t("settings.agentx.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agentx-apikey">{t("settings.agentx.apiKey.label")}</Label>
                  <Input
                    id="agentx-apikey"
                    type="password"
                    placeholder={t("settings.agentx.apiKey.placeholder")}
                    value={agentXConfig.apiKey}
                    onChange={e => handleAgentXConfigChange("apiKey", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{t("settings.agentx.apiKey.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentx-baseurl">{t("settings.agentx.baseUrl.label")}</Label>
                  <Input
                    id="agentx-baseurl"
                    type="text"
                    placeholder={t("settings.agentx.baseUrl.placeholder")}
                    value={agentXConfig.baseUrl}
                    onChange={e => handleAgentXConfigChange("baseUrl", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{t("settings.agentx.baseUrl.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentx-model">{t("settings.agentx.model.label")}</Label>
                  <Input
                    id="agentx-model"
                    type="text"
                    placeholder={t("settings.agentx.model.placeholder")}
                    value={agentXConfig.model}
                    onChange={e => handleAgentXConfigChange("model", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{t("settings.agentx.model.description")}</p>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !agentXConfig.apiKey}
                    variant="outline"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("settings.agentx.testing")}
                      </>
                    ) : (
                      t("settings.agentx.testConnection")
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveAgentXConfig}
                    disabled={isSavingAgentX}
                  >
                    {isSavingAgentX ? t("settings.agentx.saving") : t("settings.agentx.save")}
                  </Button>
                  {connectionStatus === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {connectionStatus === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MCP 配置 */}
            <MCPConfig />

            {/* Skills 配置 */}
            <SkillsConfig />
          </TabsContent>
        </Tabs>
      </div>

      {/* 重启确认弹窗 */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("messages.restartRequired")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("messages.restartDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("messages.restartLater")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>
              {t("messages.restartNow")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SettingsWindow
