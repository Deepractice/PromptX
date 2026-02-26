import { useEffect, useState } from "react"
import { createAgentX, type AgentX } from "agentxjs"
import { ResponsiveStudio } from "../../components/agentx-ui"
import { useTranslation } from "react-i18next"

export default function AgentXPage() {
  const { t } = useTranslation()
  const [agentx, setAgentx] = useState<AgentX | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [needsConfig, setNeedsConfig] = useState(false)

  useEffect(() => {
    let mounted = true
    let currentAgentx: AgentX | null = null

    const connect = async () => {
      try {
        // 先检查是否已配置 API Key
        const config = await window.electronAPI.agentx.getConfig()
        if (!config.apiKey) {
          if (!mounted) return
          setNeedsConfig(true)
          setIsConnecting(false)
          return
        }

        // 检查服务状态，如果没运行则启动
        const isRunning = await window.electronAPI.agentx.getStatus()
        if (!isRunning) {
          const startResult = await window.electronAPI.agentx.start()
          if (!startResult.success) {
            throw new Error(startResult.error || "Failed to start AgentX service")
          }
        }

        // 从主进程获取 AgentX 服务器 URL
        const serverUrl = await window.electronAPI.agentx.getServerUrl()

        if (!mounted) return

        // 连接到内嵌的 AgentX 服务器
        const ax = await createAgentX({
          serverUrl,
        })

        if (!mounted) {
          await ax.dispose()
          return
        }

        currentAgentx = ax
        setAgentx(ax)
        setIsConnecting(false)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to connect to AgentX server")
        setIsConnecting(false)
      }
    }

    connect()

    return () => {
      mounted = false
      currentAgentx?.dispose()
    }
  }, [])

  if (needsConfig) {
    return (
      <div className="flex h-full overflow-hidden items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium mb-2">{t("agentxUI.page.notConfigured.title")}</p>
          <p className="text-muted-foreground text-sm mb-4">
            {t("agentxUI.page.notConfigured.description")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("agentxUI.page.notConfigured.hint")}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full overflow-hidden  items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{t("agentxUI.page.connectionError")}</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (isConnecting || !agentx) {
    return (
      <div className="flex h-full overflow-hidden  items-center justify-center">
        <p className="text-muted-foreground">{t("agentxUI.page.connecting")}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden   w-full">
      <ResponsiveStudio
        agentx={agentx}
        containerId="promptx-desktop"
      />
    </div>
  )
}
