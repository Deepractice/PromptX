import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Brain, GitFork, Link, Clock } from "lucide-react"

type OverviewData = {
  engramCount: number
  cueCount: number
  connectionCount: number
  lastActive: string | null
  topCues: { word: string; recallFrequency: number }[]
}

export default function MemoryOverview({ roleId }: { roleId: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.electronAPI.cognition.getOverview(roleId).then((res) => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [roleId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || (data.engramCount === 0 && data.cueCount === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Brain className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">{t("roles.memory.noMemoryData")}</p>
      </div>
    )
  }

  const stats = [
    { icon: Brain, label: t("roles.memory.engramCount"), value: data.engramCount },
    { icon: GitFork, label: t("roles.memory.cueCount"), value: data.cueCount },
    { icon: Link, label: t("roles.memory.connections"), value: data.connectionCount },
    { icon: Clock, label: t("roles.memory.lastActive"), value: data.lastActive ? new Date(data.lastActive).toLocaleDateString() : "-" },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {data.topCues.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">{t("roles.memory.topCues")}</h4>
          <div className="space-y-1.5">
            {data.topCues.map(cue => (
              <div key={cue.word} className="flex items-center justify-between rounded px-3 py-1.5 bg-muted/40 text-sm">
                <span>{cue.word}</span>
                <span className="text-xs text-muted-foreground">{cue.recallFrequency}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
