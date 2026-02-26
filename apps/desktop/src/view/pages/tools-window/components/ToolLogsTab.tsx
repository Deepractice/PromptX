import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import type { ExecLogEntry } from "./ToolDetailPanel"

type Props = {
  toolId: string
  logs: ExecLogEntry[]
  onClear: () => void
}

export default function ToolLogsTab({ logs, onClear }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {t("tools.detail.execHistory")}
          <span className="ml-2 text-muted-foreground font-normal">({logs.length})</span>
        </h3>
        {logs.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onClear}>
            {t("tools.detail.clearLogs")}
          </Button>
        )}
      </div>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">{t("tools.detail.noLogs")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className={`rounded-lg border p-3 text-sm ${log.success ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {log.success ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                  <span className="font-medium">{log.success ? t("tools.detail.execSuccess") : t("tools.detail.execFailed")}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.duration}ms</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
              {log.params && <div className="mt-1 text-xs text-muted-foreground font-mono truncate">params: {log.params}</div>}
              {log.error && <div className="mt-1 text-xs text-red-600 font-mono truncate">{log.error}</div>}
              {log.result && <div className="mt-1 text-xs text-muted-foreground font-mono truncate">{log.result.substring(0, 200)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
