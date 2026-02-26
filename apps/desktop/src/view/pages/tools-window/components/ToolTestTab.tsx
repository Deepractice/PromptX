import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Clock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import type { ExecLogEntry } from "./ToolDetailPanel"
import type { ToolItem } from "./ToolListPanel"

type Props = {
  tool: ToolItem
  toolSchema: any
  onLogAdded: (entry: ExecLogEntry) => void
}

export default function ToolTestTab({ tool, toolSchema, onLogAdded }: Props) {
  const { t } = useTranslation()
  const [executing, setExecuting] = useState(false)
  const [execParams, setExecParams] = useState("{}")
  const [execResult, setExecResult] = useState<string | null>(null)
  const [execDuration, setExecDuration] = useState<number | null>(null)
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null)
  const [paramMode, setParamMode] = useState<"form" | "json">("form")
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const props = toolSchema?.parameters?.properties || {}
    const defaults: Record<string, any> = {}
    Object.entries(props).forEach(([key, prop]: [string, any]) => {
      if (prop.enum && prop.enum.length > 0) defaults[key] = prop.enum[0]
      else if (prop.type === "number") defaults[key] = ""
      else if (prop.type === "boolean") defaults[key] = false
      else defaults[key] = ""
    })
    return defaults
  })

  const handleExecute = async () => {
    setExecuting(true)
    setExecResult(null)
    setExecDuration(null)
    setExecSuccess(null)

    try {
      let parsedParams: any = undefined
      if (paramMode === "form" && toolSchema) {
        const built: Record<string, any> = {}
        const props = toolSchema?.parameters?.properties || {}
        Object.entries(formValues).forEach(([key, val]) => {
          if (val === "" || val === undefined || val === null) return
          const propDef = props[key] as any
          if (propDef?.type === "number" && typeof val === "string") {
            const n = Number(val)
            if (!isNaN(n)) built[key] = n
          } else if ((propDef?.type === "object" || propDef?.type === "array") && typeof val === "string") {
            try { built[key] = JSON.parse(val) } catch { built[key] = val }
          } else {
            built[key] = val
          }
        })
        if (Object.keys(built).length > 0) parsedParams = built
      } else {
        if (execParams.trim() && execParams.trim() !== "{}") {
          try { parsedParams = JSON.parse(execParams) } catch {
            toast.error(t("tools.messages.invalidParams"))
            setExecuting(false)
            return
          }
        }
      }

      const startTime = Date.now()
      const result = await window.electronAPI?.executeTool(tool.id, parsedParams)
      const duration = result?.duration || (Date.now() - startTime)
      setExecDuration(duration)

      if (result?.success) {
        const output = result.data
          ? typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)
          : t("tools.detail.execNoOutput")
        setExecResult(output)
        setExecSuccess(true)
        toast.success(t("tools.messages.executeSuccess", { name: tool.name }))
        onLogAdded({ toolId: tool.id, timestamp: Date.now(), duration, success: true, params: execParams.trim() !== "{}" ? execParams : undefined, result: output.substring(0, 500) })
      } else {
        const errMsg = result?.message || t("tools.messages.executeFailed")
        setExecResult(errMsg)
        setExecSuccess(false)
        toast.error(errMsg)
        onLogAdded({ toolId: tool.id, timestamp: Date.now(), duration, success: false, params: execParams.trim() !== "{}" ? execParams : undefined, error: errMsg })
      }
    } catch (e: any) {
      const errMsg = e?.message || t("tools.messages.executeFailed")
      setExecResult(errMsg)
      setExecSuccess(false)
      toast.error(errMsg)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-4">
      {execSuccess !== null && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${execSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {execSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{execSuccess ? t("tools.detail.execSuccess") : t("tools.detail.execFailed")}</span>
          {execDuration !== null && (
            <span className="ml-auto flex items-center gap-1 text-xs opacity-70"><Clock className="h-3 w-3" />{execDuration}ms</span>
          )}
        </div>
      )}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{t("tools.detail.parameters")}</h3>
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            <button className={`rounded px-2 py-0.5 text-[11px] transition-colors ${paramMode === "form" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`} onClick={() => setParamMode("form")}>{t("tools.detail.formMode")}</button>
            <button className={`rounded px-2 py-0.5 text-[11px] transition-colors ${paramMode === "json" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`} onClick={() => setParamMode("json")}>JSON</button>
          </div>
        </div>
        {paramMode === "form" && toolSchema?.parameters?.properties ? (
          <div className="rounded-lg border p-4 space-y-3 max-h-[260px] overflow-auto">
            {Object.entries(toolSchema.parameters.properties as Record<string, any>).map(([key, prop]) => {
              const required = (toolSchema.parameters.required || []).includes(key)
              return (
                <div key={key}>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1">
                    {key}{required && <span className="text-red-500">*</span>}
                  </label>
                  {prop.enum ? (
                    <select value={formValues[key] ?? ""} onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm">
                      {prop.enum.map((v: string) => (<option key={v} value={v}>{v}</option>))}
                    </select>
                  ) : prop.type === "boolean" ? (
                    <input type="checkbox" checked={!!formValues[key]} onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.checked }))} className="rounded border" />
                  ) : prop.type === "number" ? (
                    <Input type="number" value={formValues[key] ?? ""} onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={prop.description || key} className="h-8 text-sm" />
                  ) : prop.type === "object" || prop.type === "array" ? (
                    <textarea value={formValues[key] ?? ""} onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={prop.description || "JSON..."} className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm font-mono min-h-[60px] resize-y" spellCheck={false} />
                  ) : (
                    <Input value={formValues[key] ?? ""} onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={prop.description || key} className="h-8 text-sm" />
                  )}
                  {prop.description && <p className="text-[11px] text-muted-foreground mt-0.5">{prop.description}</p>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-[#1e1e2e] p-4 min-h-[100px] max-h-[200px] overflow-auto">
            <textarea value={execParams} onChange={(e) => setExecParams(e.target.value)} className="w-full h-full min-h-[80px] bg-transparent text-green-400 font-mono text-sm resize-none outline-none" spellCheck={false} placeholder='{"key": "value"}' />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{t("tools.detail.paramsHint")}</p>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-medium mb-2">{t("tools.detail.output")}</h3>
        <div className="flex-1 rounded-lg bg-[#1e1e2e] p-4 min-h-[120px] overflow-auto">
          {executing ? (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">{t("tools.detail.executing")}</span></div>
          ) : (
            <pre className={`text-sm font-mono whitespace-pre-wrap ${execSuccess === false ? "text-red-400" : "text-gray-300"}`}>{execResult || t("tools.detail.outputEmpty")}</pre>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleExecute} disabled={executing} className="bg-foreground text-background hover:bg-foreground/90">
          {executing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {t("tools.detail.runTest")}
        </Button>
      </div>
    </div>
  )
}