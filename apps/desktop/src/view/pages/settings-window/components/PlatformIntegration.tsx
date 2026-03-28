import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

const TRAE_CONFIG = `{
  "mcpServers": {
    "promptx": {
      "url": "http://127.0.0.1:5203/mcp"
    }
  }
}`

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "promptx": {
      "type": "http",
      "url": "http://127.0.0.1:5203/mcp"
    }
  }
}`

function CodeBlock({ code, label }: { code: string; label: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(t("settings.platform.copied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement("textarea")
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      toast.success(t("settings.platform.copied"))
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative group">
        <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto font-mono">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  )
}

export function PlatformIntegration() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.platform.title")}</CardTitle>
        <CardDescription>{t("settings.platform.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CodeBlock
          label={t("settings.platform.trae")}
          code={TRAE_CONFIG}
        />
        <CodeBlock
          label={t("settings.platform.claude")}
          code={CLAUDE_CONFIG}
        />
      </CardContent>
    </Card>
  )
}
