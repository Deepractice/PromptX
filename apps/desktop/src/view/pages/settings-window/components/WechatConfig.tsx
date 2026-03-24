import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Terminal } from "lucide-react"
import { toast } from "sonner"

function CommandBlock({ label, description, command, onCopy }: {
  label: string
  description: string
  command: string
  onCopy: () => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <Terminal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <code className="flex-1 text-xs font-mono break-all">{command}</code>
        </div>
        <Button variant="outline" size="icon" className="shrink-0" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function WechatConfig() {
  const { t } = useTranslation()

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    toast.success(t("settings.wechat.copied"))
  }

  const handleStart = () => {
    toast.info(t("settings.wechat.comingSoon"))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.wechat.title")}</CardTitle>
        <CardDescription>{t("settings.wechat.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommandBlock
          label={t("settings.wechat.installTitle")}
          description={t("settings.wechat.installDesc")}
          command={t("settings.wechat.installCmd")}
          onCopy={() => copyCommand(t("settings.wechat.installCmd"))}
        />

        <CommandBlock
          label={t("settings.wechat.loginTitle")}
          description={t("settings.wechat.loginDesc")}
          command={t("settings.wechat.loginCmd")}
          onCopy={() => copyCommand(t("settings.wechat.loginCmd"))}
        />

        <div className="pt-2">
          <Button variant="outline" onClick={handleStart}>
            {t("settings.wechat.startBtn")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
