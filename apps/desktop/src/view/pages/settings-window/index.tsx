import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast, Toaster } from "sonner"
import { LanguageSelector } from "./components/LanguageSelector"
interface ServerConfig {
  host: string
  port: number
  debug: boolean
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
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({ type: null, message: "" })
  const [isLoading, setIsLoading] = useState(false)

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
      // 加载自启动状态
      const autoStartEnabled = await window.electronAPI?.invoke("auto-start:status")
      setAutoStart(autoStartEnabled || false)

      // 加载服务器配置
      const config = await window.electronAPI?.invoke("server-config:get")
      if (config) {
        setServerConfig(config)
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
    } catch (error) {
      console.error("Failed to reset config:", error)
      showMessage("error", t("messages.configResetError"))
    }
  }

  return (
    <div className="min-h-[calc(100vh-53px)]  p-8 flex flex-col">
      <Toaster />
      <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col">
        {/* 页面标题 */}
        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* 语言设置 */}
          <LanguageSelector />

          {/* 自启动设置 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.autoStart.title")}</CardTitle>
              <CardDescription>{t("settings.autoStart.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 ">
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
              {/* 服务器主机 */}
              <div className="space-y-2">
                <Label htmlFor="server-host">{t("settings.server.host.label")}</Label>
                <Input id="server-host" type="text" placeholder={t("settings.server.host.placeholder")} value={serverConfig.host} onChange={e => handleServerConfigChange("host", e.target.value)} />
                <p className="text-sm text-gray-500">{t("settings.server.host.description")}</p>
              </div>

              {/* 服务器端口 */}
              <div className="space-y-2">
                <Label htmlFor="server-port">{t("settings.server.port.label")}</Label>
                <Input id="server-port" type="number" min="1" max="65535" placeholder={t("settings.server.port.placeholder")} value={serverConfig.port} onChange={e => handleServerConfigChange("port", parseInt(e.target.value) || 5203)} />
                <p className="text-sm text-gray-500">{t("settings.server.port.description")}</p>
              </div>

              {/* 调试模式 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="debug-mode" checked={serverConfig.debug} onCheckedChange={checked => handleServerConfigChange("debug", checked)} />
                  <Label htmlFor="debug-mode">{t("settings.server.debug.label")}</Label>
                </div>
                <p className="text-sm text-gray-500">{t("settings.server.debug.description")}</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleSaveConfig} disabled={isLoading} variant="outline" className="bg-black text-white">
                  {isLoading ? t("settings.server.saving") : t("settings.server.save")}
                </Button>
                <Button variant="outline" onClick={handleResetConfig} disabled={isLoading}>
                  {t("settings.server.reset")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsWindow
