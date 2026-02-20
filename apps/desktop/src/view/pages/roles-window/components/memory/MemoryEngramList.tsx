import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X } from "lucide-react"

type Engram = {
  id?: number
  rowid?: number
  content: string
  type: string
  strength: number
  schema?: string
}

const TYPE_COLORS: Record<string, string> = {
  ATOMIC: "bg-blue-100 text-blue-700",
  LINK: "bg-green-100 text-green-700",
  PATTERN: "bg-purple-100 text-purple-700",
}

export default function MemoryEngramList({ roleId }: { roleId: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<Engram[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState("")
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editType, setEditType] = useState("")
  const [editStrength, setEditStrength] = useState(0.8)
  const pageSize = 20

  const fetchData = useCallback(() => {
    setLoading(true)
    window.electronAPI.cognition
      .listEngrams(roleId, page, pageSize, typeFilter || undefined, keyword || undefined)
      .then((res) => {
        setItems(res.items || [])
        setTotal(res.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [roleId, page, typeFilter, keyword])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(0) }, [typeFilter, keyword])

  const startEdit = (engram: Engram) => {
    const id = engram.rowid ?? engram.id
    if (!id) return
    setEditingId(id)
    setEditContent(engram.content)
    setEditType(engram.type)
    setEditStrength(engram.strength)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async () => {
    if (!editingId) return
    await window.electronAPI.cognition.updateEngram(roleId, editingId, {
      content: editContent,
      type: editType,
      strength: editStrength,
    })
    setEditingId(null)
    fetchData()
  }

  const deleteEngram = async (engram: Engram) => {
    const id = engram.rowid ?? engram.id
    if (!id) return
    await window.electronAPI.cognition.deleteEngram(roleId, id)
    fetchData()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full rounded-md border bg-transparent pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={t("roles.memory.search")}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">{t("roles.memory.type")}: All</option>
          <option value="ATOMIC">ATOMIC</option>
          <option value="LINK">LINK</option>
          <option value="PATTERN">PATTERN</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("roles.memory.noMemoryData")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((engram, idx) => {
            const engramId = engram.rowid ?? engram.id
            const isEditing = editingId === engramId

            return (
              <div key={engramId ?? idx} className="rounded-lg border p-3 space-y-2 group">
                {isEditing ? (
                  /* Edit mode */
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      rows={2}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-md border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        value={editType}
                        onChange={e => setEditType(e.target.value)}
                      >
                        <option value="ATOMIC">ATOMIC</option>
                        <option value="LINK">LINK</option>
                        <option value="PATTERN">PATTERN</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        {t("roles.memory.strength")}:
                        <input
                          type="range" min="0" max="1" step="0.1"
                          className="w-16 h-1.5"
                          value={editStrength}
                          onChange={e => setEditStrength(parseFloat(e.target.value))}
                        />
                        <span className="w-6 text-center">{editStrength}</span>
                      </label>
                      <div className="flex-1" />
                      <button className="p-1 rounded hover:bg-green-100 text-green-600" onClick={saveEdit}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed line-clamp-2 flex-1">{engram.content}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[engram.type] || "bg-gray-100 text-gray-700"}`}>
                          {engram.type}
                        </span>
                        <button
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                          onClick={() => startEdit(engram)}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                          onClick={() => deleteEngram(engram)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{t("roles.memory.strength")}:</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-foreground/60" style={{ width: `${Math.min(100, (engram.strength || 0) * 100)}%` }} />
                        </div>
                      </div>
                      {engram.schema && (
                        <div className="flex gap-1 flex-wrap">
                          {engram.schema.split(',').filter(Boolean).slice(0, 3).map(kw => (
                            <span key={kw} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{kw.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
