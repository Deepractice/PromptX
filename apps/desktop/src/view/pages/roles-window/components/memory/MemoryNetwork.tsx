import { useEffect, useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force"

type CueNode = { id: string; recallFrequency: number; connectionCount: number; x?: number; y?: number }
type Edge = { source: string | CueNode; target: string | CueNode; weight: number }

export default function MemoryNetwork({ roleId, onSelectCue }: { roleId: string; onSelectCue: (word: string) => void }) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<CueNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setLoading(true)
    window.electronAPI.cognition.getNetwork(roleId, 50).then((res) => {
      if (res.nodes?.length) {
        runSimulation(res.nodes, res.edges)
      } else {
        setNodes([])
        setEdges([])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [roleId])

  const runSimulation = useCallback((rawNodes: CueNode[], rawEdges: Edge[]) => {
    const simNodes = rawNodes.map(n => ({ ...n }))
    const simEdges = rawEdges.map(e => ({ ...e }))

    const sim = forceSimulation(simNodes as any)
      .force("link", forceLink(simEdges as any).id((d: any) => d.id).distance(80))
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(20))
      .stop()

    for (let i = 0; i < 200; i++) sim.tick()

    setNodes(simNodes)
    setEdges(simEdges)
  }, [])

  const maxFreq = Math.max(1, ...nodes.map(n => n.recallFrequency))
  const maxConn = Math.max(1, ...nodes.map(n => n.connectionCount))

  const getRadius = (n: CueNode) => 6 + (n.recallFrequency / maxFreq) * 14
  const getColor = (n: CueNode) => {
    const ratio = n.connectionCount / maxConn
    const g = Math.round(80 + ratio * 120)
    return `rgb(${80}, ${g}, ${200})`
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({ ...t, k: Math.max(0.2, Math.min(5, t.k * delta)) }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }
  const handleMouseUp = () => { dragging.current = false }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" /></div>
  }

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">{t("roles.memory.noMemoryData")}</p>
  }

  return (
    <div className="rounded-lg border bg-muted/10 overflow-hidden" style={{ height: 400 }}>
      <svg
        ref={svgRef}
        width="100%" height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      >
        <g transform={`translate(${transform.x + 350}, ${transform.y + 200}) scale(${transform.k})`}>
          {edges.map((e, i) => {
            const s = e.source as CueNode
            const t = e.target as CueNode
            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="currentColor" strokeOpacity={0.15 + (e.weight || 1) * 0.05} strokeWidth={1} />
          })}
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`} onClick={() => onSelectCue(n.id)} style={{ cursor: "pointer" }}>
              <circle r={getRadius(n)} fill={getColor(n)} opacity={0.8} />
              <text y={getRadius(n) + 12} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>{n.id}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
