import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Trash2 } from "lucide-react"

type Connection = { target: string; weight: number }
type CueDetail = {
  word: string
  recallFrequency: number
  connections: Connection[]
  memories: { content: string; type: string; strength: number }[]
}

const TYPE_I18N: Record<string, string> = {
  ATOMIC: "roles.memory.typeAtomic",
  LINK: "roles.memory.typeLink",
  PATTERN: "roles.memory.typePattern",
}

export default function MemoryCueExplorer({
  roleId,
  initialCue,
  onSelectCue,
}: {
  roleId: string
  initialCue?: string
  onSelectCue?: (word: string) => void
}) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<CueDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const deleteCue = async (word: string) => {
    await window.electronAPI.cognition.deleteCue(roleId, word)
    setDetail(null)
  }

  const fetchCue = useCallback((word: string) => {
    if (!word.trim()) return
    setLoading(true)
    window.electronAPI.cognition.getCueDetail(roleId, word.trim()).then((res) => {
      setDetail(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [roleId])

  useEffect(() => {
    if (initialCue) fetchCue(initialCue)
  }, [initialCue, fetchCue])

  const navigateCue = (word: string) => {
    fetchCue(word)
    onSelectCue?.(word)
  }

  if (!initialCue && !detail) return null

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 group">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold">{detail.word}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("roles.memory.recallFrequency")}: {detail.recallFrequency}
                </span>
                <button
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                  onClick={() => deleteCue(detail.word)}
                  title={t("roles.memory.deleteCue")}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>
          </div>

          {detail.connections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t("roles.memory.connections")} ({detail.connections.length})</h4>
              <div className="space-y-1">
                {detail.connections.map(conn => (
                  <button
                    key={conn.target}
                    className="flex items-center justify-between w-full rounded px-3 py-1.5 bg-muted/40 text-sm hover:bg-muted transition-colors"
                    onClick={() => navigateCue(conn.target)}
                  >
                    <span className="flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {conn.target}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("roles.memory.weight")}: {conn.weight.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {detail.memories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t("roles.memory.engrams")} ({detail.memories.length})</h4>
              <div className="space-y-1.5">
                {detail.memories.map((mem, i) => (
                  <div key={i} className="rounded border p-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1">{mem.content}</p>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted">{t(TYPE_I18N[mem.type] || mem.type)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
