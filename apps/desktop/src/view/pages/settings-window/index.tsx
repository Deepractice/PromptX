import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast, Toaster } from "sonner"
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
      showMessage("error", "加载设置失败，请重试")
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
        showMessage("success", "已启用开机自启动")
      } else {
        await window.electronAPI?.invoke("auto-start:disable")
        showMessage("success", "已禁用开机自启动")
      }
      setAutoStart(enabled)
    } catch (error) {
      console.error("Failed to toggle auto-start:", error)
      showMessage("error", "操作失败，请重试")
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
      showMessage("success", "配置已保存并应用")
    } catch (error) {
      console.error("Failed to save config:", error)
      showMessage("error", "保存配置失败，请重试")
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
      showMessage("success", "已重置为默认配置")
    } catch (error) {
      console.error("Failed to reset config:", error)
      showMessage("error", "重置配置失败，请重试")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster />
      <div className="mx-auto max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Customize your PromptX experience</p>
        </div>

       

        <div className="space-y-6">
          {/* 自启动设置 */}
          <Card>
            <CardHeader>
              <CardTitle>Auto Start</CardTitle>
              <CardDescription>Launch PromptX automatically when computer starts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 ">
                <Switch id="auto-start" checked={autoStart} onCheckedChange={handleAutoStartToggle} />
                <Label htmlFor="auto-start">Enable auto start</Label>
              </div>
            </CardContent>
          </Card>

          {/* 服务器配置 */}
          <Card>
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>Configure server host, port and debug settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 服务器主机 */}
              <div className="space-y-2">
                <Label htmlFor="server-host">Server Host</Label>
                <Input id="server-host" type="text" placeholder="127.0.0.1" value={serverConfig.host} onChange={e => handleServerConfigChange("host", e.target.value)} />
                <p className="text-sm text-gray-500">Host address for the server to listen on, e.g. 127.0.0.1</p>
              </div>

              {/* 服务器端口 */}
              <div className="space-y-2">
                <Label htmlFor="server-port">Server Port</Label>
                <Input id="server-port" type="number" min="1" max="65535" placeholder="5203" value={serverConfig.port} onChange={e => handleServerConfigChange("port", parseInt(e.target.value) || 5203)} />
                <p className="text-sm text-gray-500">Port for the server to listen on, range 1-65535</p>
              </div>

              {/* 调试模式 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="debug-mode" checked={serverConfig.debug} onCheckedChange={checked => handleServerConfigChange("debug", checked)} />
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                </div>
                <p className="text-sm text-gray-500">Output more log information for troubleshooting</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleSaveConfig} disabled={isLoading} variant="outline" className="bg-black text-white">
                  {isLoading ? "Saving..." : "Save Configuration"}
                </Button>
                <Button variant="outline" onClick={handleResetConfig} disabled={isLoading}>
                  Reset to Default
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
