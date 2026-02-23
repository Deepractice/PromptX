import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface WebAccessStatus {
  enabled: boolean
  url?: string
  qrCodeDataUrl?: string
  port?: number
}

export function WebAccessConfig() {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(false)
  const [port, setPort] = useState(5201)
  const [status, setStatus] = useState<WebAccessStatus>({ enabled: false })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const s = await window.electronAPI?.webAccess.getStatus()
      setEnabled(s?.enabled ?? false)
      if (s?.enabled && s?.url) {
        setStatus({ enabled: true, url: s.url, qrCodeDataUrl: s.qrCodeDataUrl, port: s.port })
      }
    } catch (e) {
      console.error("Failed to load web access status:", e)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    try {
      if (checked) {
        const result = await window.electronAPI?.webAccess.enable(port)
        if (result?.success) {
          setEnabled(true)
          setStatus({ enabled: true, url: result.url, qrCodeDataUrl: result.qrCodeDataUrl, port: result.port })
          toast.success(t("settings.webAccess.enabled"))
        } else {
          toast.error(result?.error || t("settings.webAccess.enableFailed"))
        }
      } else {
        const result = await window.electronAPI?.webAccess.disable()
        if (result?.success) {
          setEnabled(false)
          setStatus({ enabled: false })
          toast.success(t("settings.webAccess.disabled"))
        } else {
          toast.error(result?.error || t("settings.webAccess.disableFailed"))
        }
      }
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const copyUrl = () => {
    if (status.url) {
      navigator.clipboard.writeText(status.url)
      toast.success(t("settings.webAccess.copyUrl"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.webAccess.title")}</CardTitle>
        <CardDescription>{t("settings.webAccess.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="web-port">{t("settings.webAccess.port.label")}</Label>
          <Input
            id="web-port"
            type="number"
            min="1024"
            max="65535"
            value={port}
            onChange={e => setPort(parseInt(e.target.value) || 5201)}
            disabled={enabled}
            className="w-40"
          />
          <p className="text-sm text-muted-foreground">{t("settings.webAccess.port.description")}</p>
        </div>

        <div className="flex items-center space-x-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Switch id="web-access" checked={enabled} onCheckedChange={handleToggle} />
          )}
          <Label htmlFor="web-access">{t("settings.webAccess.toggle")}</Label>
        </div>

        {enabled && status.url && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input value={status.url} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(status.url, '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {status.qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={status.qrCodeDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg border border-border"
                />
                <p className="text-sm text-muted-foreground">{t("settings.webAccess.qrHint")}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
