import { useState, useEffect } from "react"
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
          toast.success("远程访问已开启")
        } else {
          toast.error(result?.error || "开启失败")
        }
      } else {
        const result = await window.electronAPI?.webAccess.disable()
        if (result?.success) {
          setEnabled(false)
          setStatus({ enabled: false })
          toast.success("远程访问已关闭")
        } else {
          toast.error(result?.error || "关闭失败")
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
      toast.success("链接已复制")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>远程访问</CardTitle>
        <CardDescription>开启后可通过局域网扫码访问网页版 PromptX，支持多会话对话</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="web-port">HTTP 端口</Label>
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
          <p className="text-sm text-muted-foreground">网页服务端口，默认 5201</p>
        </div>

        <div className="flex items-center space-x-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Switch id="web-access" checked={enabled} onCheckedChange={handleToggle} />
          )}
          <Label htmlFor="web-access">开启远程访问</Label>
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
                <p className="text-sm text-muted-foreground">扫码在手机或其他设备上访问</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
