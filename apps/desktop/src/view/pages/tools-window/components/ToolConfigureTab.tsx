import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Pencil, Save } from "lucide-react"
import { toast } from "sonner"
import type { ToolItem } from "./ToolListPanel"

type Props = {
  tool: ToolItem
}

export default function ToolConfigureTab({ tool }: Props) {
  const { t } = useTranslation()
  const [toolFiles, setToolFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [fileLoading, setFileLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.electronAPI?.invoke("resources:listFiles", {
      id: tool.id, type: "tool", source: tool.source ?? "user",
    }).then((res: any) => {
      if (res?.success && res.files) setToolFiles(res.files)
    }).catch(() => {})
  }, [tool.id, tool.source])

  const loadFileContent = async (filePath: string) => {
    setFileLoading(true)
    setSelectedFile(filePath)
    try {
      const res = await window.electronAPI?.invoke("resources:readFile", {
        id: tool.id, type: "tool", source: tool.source ?? "user", relativePath: filePath,
      })
      setFileContent(res?.success ? (res.content || "") : `// Error: ${res?.message || "Failed to read file"}`)
    } catch (e: any) {
      setFileContent(`// Error: ${e?.message || "Failed to read file"}`)
    } finally {
      setFileLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return
    setSaving(true)
    try {
      const res = await window.electronAPI?.invoke("resources:saveFile", {
        id: tool.id, type: "tool", source: tool.source ?? "user", relativePath: selectedFile, content: editContent,
      })
      if (res?.success) {
        setFileContent(editContent)
        setIsEditing(false)
        toast.success(t("tools.messages.saveSuccess"))
      } else {
        toast.error(res?.message || t("tools.messages.saveFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("tools.messages.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-5 min-h-0">
      <div>
        <h3 className="text-sm font-medium mb-2">{t("tools.detail.toolFiles")}</h3>
        {toolFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("tools.detail.noFiles")}</p>
        ) : (
          <div className="space-y-1">
            {toolFiles.map((file) => (
              <button key={file} className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${selectedFile === file ? "bg-accent border border-border" : "hover:bg-muted"}`} onClick={() => loadFileContent(file)}>
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate font-mono text-xs">{file}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedFile && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium font-mono">{selectedFile}</h3>
            <div className="flex items-center gap-2">
              {(tool.source ?? "user") === "user" ? (
                isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>{t("tools.detail.cancel")}</Button>
                    <Button size="sm" className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={handleSaveFile} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      {t("tools.detail.save")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditContent(fileContent); setIsEditing(true) }}>
                    <Pencil className="h-3 w-3 mr-1" />{t("tools.detail.edit")}
                  </Button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">{t("tools.detail.readOnly")}</span>
              )}
            </div>
          </div>
          <div className={`flex-1 rounded-lg bg-[#1e1e2e] ${isEditing ? "flex flex-col overflow-hidden" : "p-4 overflow-auto"}`}>
            {fileLoading ? (
              <div className="flex items-center gap-2 text-gray-400 p-4"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">{t("tools.detail.loadingFile")}</span></div>
            ) : isEditing ? (
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full flex-1 bg-transparent text-green-400 font-mono text-sm resize-none outline-none p-4" spellCheck={false} />
            ) : (
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{fileContent}</pre>
            )}
          </div>
        </div>
      )}
      {tool.parameters && (
        <div className="shrink-0 max-h-[200px] overflow-auto">
          <h3 className="text-sm font-medium mb-2">{t("tools.detail.paramSchema")}</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
              {typeof tool.parameters === "string" ? tool.parameters : JSON.stringify(tool.parameters, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
