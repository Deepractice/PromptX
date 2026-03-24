import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, ExternalLink, Circle } from "lucide-react"
import { toast } from "sonner"

interface FeishuConfigData {
  appId: string
  appSecret: string
  encryptKey: string
}

interface FeishuStatus {
  connected: boolean
  appId?: string
  error?: string
}

const EMPTY_CONFIG: FeishuConfigData = {
  appId: "",
  appSecret: "",
  encryptKey: ""
}

export function FeishuConfig() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<FeishuConfigData>(EMPTY_CONFIG)
  const [status, setStatus] = useState<FeishuStatus>({ connected: false })
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const s = await window.electronAPI?.invoke("feishu:status")
      if (s) setStatus(s)
    } catch {
      // ignore
    }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      console.log("[FeishuConfig] loadConfig calling feishu:getConfig")
      const saved = await window.electronAPI?.invoke("feishu:getConfig")
      console.log("[FeishuConfig] loadConfig result:", saved)
      if (saved) {
        setConfig({
          appId: saved.appId || "",
          appSecret: saved.appSecret || "",
          encryptKey: saved.encryptKey || ""
        })
      }
    } catch (e) {
      console.error("[FeishuConfig] loadConfig error:", e)
    }
  }, [])

  useEffect(() => {
    loadConfig()
    loadStatus()
  }, [loadConfig, loadStatus])

  const handleSave = async () => {
    if (!config.appId || !config.appSecret) {
      toast.error(t("settings.feishu.saveFailed"))
      return
    }
    setIsSaving(true)
    try {
      console.log("[FeishuConfig] saving config:", config)
      const result = await window.electronAPI?.invoke("feishu:saveConfig", config)
      console.log("[FeishuConfig] save result:", result)
      if (result?.success === false) {
        toast.error(result.error || t("settings.feishu.saveFailed"))
      } else {
        toast.success(t("settings.feishu.saveSuccess"))
      }
    } catch (e) {
      console.error("[FeishuConfig] save error:", e)
      toast.error(t("settings.feishu.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (checked && (!config.appId || !config.appSecret)) {
      toast.error(t("settings.feishu.configRequired"))
      return
    }

    setIsToggling(true)
    try {
      if (checked) {
        // Save config first, then start
        await window.electronAPI?.invoke("feishu:saveConfig", config)
        const result = await window.electronAPI?.invoke("feishu:start", config, { name: "PromptX" })
        if (result?.success === false) {
          toast.error(result.error || t("settings.feishu.startFailed"))
        } else {
          toast.success(t("settings.feishu.startSuccess"))
        }
      } else {
        const result = await window.electronAPI?.invoke("feishu:stop")
        if (result?.success === false) {
          toast.error(result.error || t("settings.feishu.stopFailed"))
        } else {
          toast.success(t("settings.feishu.stopSuccess"))
        }
      }
      await loadStatus()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsToggling(false)
    }
  }

  const handleRemove = async () => {
    try {
      await window.electronAPI?.invoke("feishu:remove")
      setConfig(EMPTY_CONFIG)
      setStatus({ connected: false })
      toast.success(t("settings.feishu.removeSuccess"))
    } catch {
      toast.error(t("settings.feishu.removeFailed"))
    }
  }

  const openFeishuPlatform = async () => {
    const url = "https://open.feishu.cn/"
    try {
      if (window.electronAPI?.shell?.openExternal) {
        await window.electronAPI.shell.openExternal(url)
      } else {
        window.open(url, "_blank")
      }
    } catch {
      window.open(url, "_blank")
    }
  }

  const connected = status.connected

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t("settings.feishu.title")}
              <span className="inline-flex items-center gap-1 text-xs font-normal">
                <Circle
                  className={`h-2 w-2 fill-current ${connected ? "text-green-500" : "text-muted-foreground"}`}
                />
                {connected ? t("settings.feishu.connected") : t("settings.feishu.disconnected")}
              </span>
            </CardTitle>
            <CardDescription>{t("settings.feishu.description")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch checked={connected} onCheckedChange={handleToggle} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="feishu-app-id">{t("settings.feishu.appId.label")}</Label>
          <Input
            id="feishu-app-id"
            type="text"
            placeholder={t("settings.feishu.appId.placeholder")}
            value={config.appId}
            onChange={e => setConfig(prev => ({ ...prev, appId: e.target.value }))}
            disabled={connected}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feishu-app-secret">{t("settings.feishu.appSecret.label")}</Label>
          <Input
            id="feishu-app-secret"
            type="password"
            placeholder={t("settings.feishu.appSecret.placeholder")}
            value={config.appSecret}
            onChange={e => setConfig(prev => ({ ...prev, appSecret: e.target.value }))}
            disabled={connected}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feishu-encrypt-key">{t("settings.feishu.encryptKey.label")}</Label>
          <Input
            id="feishu-encrypt-key"
            type="text"
            placeholder={t("settings.feishu.encryptKey.placeholder")}
            value={config.encryptKey}
            onChange={e => setConfig(prev => ({ ...prev, encryptKey: e.target.value }))}
            disabled={connected}
          />
        </div>

        {status.error && (
          <p className="text-sm text-destructive">{status.error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || connected || !config.appId || !config.appSecret}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.feishu.saving")}
              </>
            ) : (
              t("settings.feishu.save")
            )}
          </Button>
          {connected && (
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              {t("settings.feishu.remove")}
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("settings.feishu.guide")}{" "}
          <button
            onClick={openFeishuPlatform}
            className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {t("settings.feishu.guideLink")}
            <ExternalLink className="h-3 w-3" />
          </button>
        </p>
      </CardContent>
    </Card>
  )
}
