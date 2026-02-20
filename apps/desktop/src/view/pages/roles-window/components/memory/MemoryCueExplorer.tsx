import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, ArrowRight, Trash2 } from "lucide-react"

type Connection = { target: string; weight: number }
type CueDetail = {
  word: string
  recallFrequency: number
  connections: Connection[]
  memories: { content: string; type: string; strength: number }[]
}

export default function MemoryCueExplorer({ roleId, initialCue }: { roleId: string; initialCue?: string }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(initialCue || "")
  const [activeCue, setActiveCue] = useState(initialCue || "")
  const [detail, setDetail] = useState<CueDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const deleteCue = async (word: string) => {
    await window.electronAPI.cognition.deleteCue(roleId, word)
    setDetail(null)
    setActiveCue("")
    setSearch("")
  }

  const fetchCue = useCallback((word: string) => {
    if (!word.trim()) return
    setLoading(true)
    setActiveCue(word)
    window.electronAPI.cognition.getCueDetail(roleId, word.trim()).then((res) => {
      setDetail(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [roleId])

  useEffect(() => {
    if (initialCue) fetchCue(initialCue)
  }, [initialCue, fetchCue])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCue(search)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full rounded-md border bg-transparent pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={t("roles.memory.search")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </form>

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-4">
          {/* Cue header */}
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

          {/* Connections */}
          {detail.connections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t("roles.memory.connections")} ({detail.connections.length})</h4>
              <div className="space-y-1">
                {detail.connections.map(conn => (
                  <button
                    key={conn.target}
                    className="flex items-center justify-between w-full rounded px-3 py-1.5 bg-muted/40 text-sm hover:bg-muted transition-colors"
                    onClick={() => { setSearch(conn.target); fetchCue(conn.target) }}
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

          {/* Associated memories */}
          {detail.memories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t("roles.memory.engrams")} ({detail.memories.length})</h4>
              <div className="space-y-1.5">
                {detail.memories.map((mem, i) => (
                  <div key={i} className="rounded border p-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1">{mem.content}</p>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted">{mem.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !detail && activeCue && (
        <p className="text-sm text-muted-foreground text-center py-8">{t("roles.memory.noMemoryData")}</p>
      )}
    </div>
  )
}
