import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, BookOpen, Layers, Brain, FileText, ChevronRight, ChevronDown, Save, Loader2, Target, Building2, Upload } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import type { RoleItem } from "./RoleListPanel"
import MemoryTab from "./MemoryTab"
import RoleAvatar from "./RoleAvatar"

type Props = {
  selectedRole: RoleItem | null
  onActivate: (role: RoleItem) => void
  onUpdate?: () => void
}

// V1 Overview Tab: Description + Role Prompt
function V1OverviewTab({ role }: { role: RoleItem }) {
  const { t } = useTranslation()
  const [promptContent, setPromptContent] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPrompt = async () => {
      setLoading(true)
      try {
        const res = await window.electronAPI?.getRolePrompt?.(role.id, role.source || "user", { roleResources: "all" })
        if (res?.success && res.prompt) {
          setPromptContent(res.prompt)
        } else {
          setPromptContent(t("roles.detail.promptLoadError") || "Failed to load prompt")
        }
      } catch (e) {
        setPromptContent(t("roles.detail.promptLoadError") || "Failed to load prompt")
      } finally {
        setLoading(false)
      }
    }
    loadPrompt()
  }, [role, t])

  return (
    <div className="flex flex-col h-full">
      {/* Description Section - Compact */}
      <div className="rounded-lg border bg-card p-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{t("roles.detail.description")}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {role.description || t("roles.noDescription")}
        </p>
      </div>

      {/* Role Prompt Section - Fills remaining space */}
      <div className="rounded-lg border bg-card p-4 flex-1 flex flex-col min-h-0 mt-4">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{t("roles.detail.rolePrompt")}</h3>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {promptContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// V1 Structure Tab: Real file tree with file viewer
function V1StructureTab({ role }: { role: RoleItem }) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // File viewer dialog state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerFile, setViewerFile] = useState("")
  const [viewerContent, setViewerContent] = useState("")
  const [viewerLoading, setViewerLoading] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Collapsible layer state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    role: true,
    thought: true,
    execution: true,
    knowledge: true,
  })

  const isReadOnly = (role.source ?? "user") !== "user"

  // Load file list
  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await window.electronAPI?.invoke("resources:listFiles", {
          id: role.id,
          type: "role",
          source: role.source ?? "user",
        })
        if (res?.success) {
          setFiles(res.files || [])
        } else {
          // For system roles, directory may not be accessible in packaged app
          if ((role.source === "system" || role.source === "package") && !res?.success) {
            setError("__system_readonly__")
          } else {
            setError(res?.message || t("roles.detail.loadFilesFailed"))
          }
        }
      } catch {
        if (role.source === "system" || role.source === "package") {
          setError("__system_readonly__")
        } else {
          setError(t("roles.detail.loadFilesFailed"))
        }
      } finally {
        setLoading(false)
      }
    }
    loadFiles()
  }, [role, t])

  // Categorize files into layers
  const categorized = useCallback(() => {
    const roleFiles: string[] = []
    const thoughtFiles: string[] = []
    const executionFiles: string[] = []
    const knowledgeFiles: string[] = []

    for (const f of files) {
      if (f.startsWith("thought/") || f.endsWith(".thought.md")) {
        thoughtFiles.push(f)
      } else if (f.startsWith("execution/") || f.endsWith(".execution.md")) {
        executionFiles.push(f)
      } else if (f.startsWith("knowledge/") || f.endsWith(".knowledge.md")) {
        knowledgeFiles.push(f)
      } else {
        roleFiles.push(f)
      }
    }

    return { roleFiles, thoughtFiles, executionFiles, knowledgeFiles }
  }, [files])

  const { roleFiles, thoughtFiles, executionFiles, knowledgeFiles } = categorized()

  // Open file viewer
  const openFile = async (filePath: string) => {
    setViewerFile(filePath)
    setViewerOpen(true)
    setViewerLoading(true)
    setIsEditing(false)
    try {
      const res = await window.electronAPI?.invoke("resources:readFile", {
        id: role.id,
        type: "role",
        source: role.source ?? "user",
        relativePath: filePath,
      })
      if (res?.success) {
        setViewerContent(res.content || "")
        setEditedContent(res.content || "")
      } else {
        setViewerContent(t("roles.detail.loadContentFailed"))
      }
    } catch {
      setViewerContent(t("roles.detail.loadContentFailed"))
    } finally {
      setViewerLoading(false)
    }
  }

  // Save file
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await window.electronAPI?.invoke("resources:saveFile", {
        id: role.id,
        type: "role",
        source: role.source ?? "user",
        relativePath: viewerFile,
        content: editedContent,
      })
      if (res?.success) {
        setViewerContent(editedContent)
        setIsEditing(false)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Get display name from file path
  const getFileName = (filePath: string) => {
    const parts = filePath.split("/")
    return parts[parts.length - 1]
  }

  // Render a single file item
  const renderFileItem = (filePath: string) => (
    <button
      key={filePath}
      className="flex items-center gap-2 w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted/80 transition-colors group"
      onClick={() => openFile(filePath)}
    >
      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="truncate text-muted-foreground group-hover:text-foreground">
        {getFileName(filePath)}
      </span>
    </button>
  )

  // Render a layer section
  const renderLayer = (
    key: string,
    label: string,
    description: string,
    layerFiles: string[],
    colorClass: string,
    iconBg: string,
  ) => (
    <div key={key} className="rounded-lg border bg-card overflow-hidden">
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${iconBg}`}
        onClick={() => toggleExpanded(key)}
      >
        {expanded[key] ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">({layerFiles.length})</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </button>
      {expanded[key] && layerFiles.length > 0 && (
        <div className="px-3 pb-2 pl-10 space-y-0.5">
          {layerFiles.map((f) => renderFileItem(f))}
        </div>
      )}
      {expanded[key] && layerFiles.length === 0 && (
        <div className="px-3 pb-3 pl-10">
          <span className="text-xs text-muted-foreground">{t("roles.detail.noFiles")}</span>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t("roles.detail.loadingFiles")}</span>
      </div>
    )
  }

  if (error) {
    if (error === "__system_readonly__") {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Layers className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("roles.detail.systemRoleReadOnly")}</p>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 h-full overflow-y-auto">
        {/* Role definition files */}
        {roleFiles.length > 0 &&
          renderLayer(
            "role",
            t("roles.detail.roleFile"),
            role.id + ".role.md",
            roleFiles,
            "bg-violet-500",
            "",
          )}

        {/* Personality / Thought layer */}
        {renderLayer(
          "thought",
          t("roles.detail.personalityLayer"),
          t("roles.detail.personalityDesc"),
          thoughtFiles,
          "bg-blue-500",
          "",
        )}

        {/* Principle / Execution layer */}
        {renderLayer(
          "execution",
          t("roles.detail.principleLayer"),
          t("roles.detail.principleDesc"),
          executionFiles,
          "bg-emerald-500",
          "",
        )}

        {/* Knowledge layer */}
        {renderLayer(
          "knowledge",
          t("roles.detail.knowledgeLayer"),
          t("roles.detail.knowledgeDesc"),
          knowledgeFiles,
          "bg-amber-500",
          "",
        )}
      </div>

      {/* File Content Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-[85vw] h-[75vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {getFileName(viewerFile)}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="font-mono text-xs">{viewerFile}</span>
              {isReadOnly && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {t("roles.detail.readOnly")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("roles.detail.loadingContent")}</span>
              </div>
            ) : isEditing && !isReadOnly ? (
              <textarea
                className="w-full h-full resize-none bg-transparent p-4 text-sm font-mono leading-relaxed focus:outline-none"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            ) : (
              <pre className="w-full h-full overflow-auto p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {viewerContent}
              </pre>
            )}
          </div>

          <DialogFooter className="shrink-0">
            {!isReadOnly && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedContent(viewerContent)
                        setIsEditing(false)
                      }}
                    >
                      {t("roles.memory.cancel")}
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {saving ? t("roles.detail.saving") : t("roles.detail.save")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    {t("roles.detail.editRole")}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Shared hook for V2 role data
function useV2RoleData(roleId: string) {
  const [data, setData] = useState<{ identity: string; focus: any; directory: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await window.electronAPI?.invoke("resources:getV2RoleData", { roleId })
        if (res?.success) {
          setData({ identity: res.identity || "", focus: res.focus, directory: res.directory })
        } else {
          setError(res?.message || "Failed to load role data")
        }
      } catch {
        setError("Failed to load role data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roleId])

  return { data, loading, error }
}

// V2 Overview Tab: Description + Identity text
function V2OverviewTab({ role, data, loading }: { role: RoleItem; data: any; loading: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full">
      <div className="rounded-lg border bg-card p-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{t("roles.detail.description")}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {role.description || t("roles.noDescription")}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4 flex-1 flex flex-col min-h-0 mt-4">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{t("roles.detail.identity")}</h3>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("roles.detail.loadingData")}</p>
          ) : (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {data?.identity || t("roles.noDescription")}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// V2 Goals Tab: Current focus with plan and tasks
function V2GoalsTab({ data, loading }: { data: any; loading: boolean }) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t("roles.detail.loadingData")}</span>
      </div>
    )
  }

  const current = data?.focus?.current
  const otherGoals: any[] = data?.focus?.otherGoals || []

  if (!current && otherGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Target className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("roles.detail.noGoals")}</p>
      </div>
    )
  }

  const taskStatusColor = (s: string) =>
    s === "completed" ? "bg-green-500" : s === "in_progress" ? "bg-blue-500" : "bg-muted-foreground/30"
  const taskStatusLabel = (s: string) =>
    s === "completed" ? t("roles.detail.taskCompleted")
      : s === "in_progress" ? t("roles.detail.taskInProgress")
      : t("roles.detail.taskPending")

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {current && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">{t("roles.detail.currentGoal")}</span>
          </div>
          <p className="text-sm font-semibold mb-1">{current.name}</p>
          {current.description && (
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{current.description}</p>
          )}
          {current.plan && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t("roles.detail.goalPlan")}</p>
              <p className="text-sm">{current.plan.name}</p>
            </div>
          )}
          {current.tasks && current.tasks.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("roles.detail.goalTasks")}</p>
              <div className="space-y-1.5">
                {current.tasks.map((task: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${taskStatusColor(task.status)}`} />
                    <span className="text-sm flex-1 truncate">{task.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{taskStatusLabel(task.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {otherGoals.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("roles.detail.goals")} ({otherGoals.length})
          </p>
          <div className="space-y-1">
            {otherGoals.map((goal: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                <span className="text-sm text-muted-foreground">{goal.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// V2 Organization Tab: Organization membership
function V2OrganizationTab({ role, data, loading }: { role: RoleItem; data: any; loading: boolean }) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t("roles.detail.loadingData")}</span>
      </div>
    )
  }

  const directory = data?.directory
  const roleEntry = directory?.roles?.find((r: any) => r.name === role.id)
  const orgName = roleEntry?.org
  const position = roleEntry?.position
  const org = orgName ? directory?.organizations?.find((o: any) => o.name === orgName) : null

  if (!orgName) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Building2 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("roles.detail.noOrganization")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{orgName}</h3>
          {org?.parent && <span className="text-xs text-muted-foreground">← {org.parent}</span>}
        </div>
        {position && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">{t("roles.detail.orgPosition")}:</span>
            <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{position}</span>
          </div>
        )}
        {org?.members && org.members.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("roles.detail.orgMembers")}</p>
            <div className="space-y-1.5">
              {org.members.map((member: any, i: number) => {
                const name = typeof member === "string" ? member : member.name
                const pos = typeof member === "object" ? member.position : undefined
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                      {name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm flex-1">{name}</span>
                    {pos && <span className="text-xs text-muted-foreground">{pos}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// V2 Structure Tab: identity .feature files with viewer/editor
function V2StructureTab({ role }: { role: RoleItem }) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerFile, setViewerFile] = useState("")
  const [viewerContent, setViewerContent] = useState("")
  const [viewerLoading, setViewerLoading] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    persona: true, knowledge: true, voice: true, experience: true,
  })

  const isReadOnly = (role.source ?? "user") !== "user"

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await window.electronAPI?.invoke("resources:listV2RoleFiles", { roleId: role.id })
        if (res?.success) setFiles(res.files || [])
        else setError(res?.message || t("roles.detail.loadFilesFailed"))
      } catch { setError(t("roles.detail.loadFilesFailed")) }
      finally { setLoading(false) }
    }
    load()
  }, [role, t])

  const categorize = useCallback(() => {
    const persona: string[] = [], knowledge: string[] = [], voice: string[] = [], experience: string[] = []
    for (const f of files) {
      if (f.includes(".knowledge.")) knowledge.push(f)
      else if (f.includes(".voice.")) voice.push(f)
      else if (f.includes(".experience.")) experience.push(f)
      else persona.push(f)
    }
    return { persona, knowledge, voice, experience }
  }, [files])

  const { persona, knowledge, voice, experience } = categorize()

  const openFile = async (fileName: string) => {
    setViewerFile(fileName)
    setViewerOpen(true)
    setViewerLoading(true)
    setIsEditing(false)
    try {
      const res = await window.electronAPI?.invoke("resources:readV2RoleFile", { roleId: role.id, fileName })
      if (res?.success) { setViewerContent(res.content || ""); setEditedContent(res.content || "") }
      else setViewerContent(t("roles.detail.loadContentFailed"))
    } catch { setViewerContent(t("roles.detail.loadContentFailed")) }
    finally { setViewerLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await window.electronAPI?.invoke("resources:saveV2RoleFile", {
        roleId: role.id, fileName: viewerFile, content: editedContent,
      })
      if (res?.success) { setViewerContent(editedContent); setIsEditing(false) }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const renderLayer = (key: string, label: string, desc: string, layerFiles: string[], color: string) => (
    <div key={key} className="rounded-lg border bg-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
      >
        {expanded[key] ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">({layerFiles.length})</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
      </button>
      {expanded[key] && (
        <div className="px-3 pb-2 pl-10 space-y-0.5">
          {layerFiles.length === 0
            ? <span className="text-xs text-muted-foreground">{t("roles.detail.noFiles")}</span>
            : layerFiles.map(f => (
              <button key={f} className="flex items-center gap-2 w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted/80 transition-colors group" onClick={() => openFile(f)}>
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate text-muted-foreground group-hover:text-foreground">{f}</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )

  if (isReadOnly) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Layers className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{t("roles.detail.systemRoleReadOnly")}</p>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">{t("roles.detail.loadingFiles")}</span>
    </div>
  )
  if (error) return <div className="flex items-center justify-center py-20"><p className="text-sm text-destructive">{error}</p></div>

  return (
    <>
      <div className="space-y-3 h-full overflow-y-auto">
        {renderLayer("persona", t("roles.detail.v2PersonaLayer"), t("roles.detail.v2PersonaDesc"), persona, "bg-violet-500")}
        {renderLayer("knowledge", t("roles.detail.v2KnowledgeLayer"), t("roles.detail.v2KnowledgeDesc"), knowledge, "bg-amber-500")}
        {renderLayer("voice", t("roles.detail.v2VoiceLayer"), t("roles.detail.v2VoiceDesc"), voice, "bg-blue-500")}
        {renderLayer("experience", t("roles.detail.v2ExperienceLayer"), t("roles.detail.v2ExperienceDesc"), experience, "bg-emerald-500")}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-[85vw] h-[75vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />{viewerFile}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="font-mono text-xs">{role.id}/identity/{viewerFile}</span>
              {isReadOnly && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t("roles.detail.readOnly")}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isEditing && !isReadOnly ? (
              <textarea className="w-full h-full resize-none bg-transparent p-4 text-sm font-mono leading-relaxed focus:outline-none" value={editedContent} onChange={e => setEditedContent(e.target.value)} />
            ) : (
              <pre className="w-full h-full overflow-auto p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground">{viewerContent}</pre>
            )}
          </div>
          <DialogFooter className="shrink-0">
            {!isReadOnly && (
              isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setEditedContent(viewerContent); setIsEditing(false) }}>{t("roles.memory.cancel")}</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {saving ? t("roles.detail.saving") : t("roles.detail.save")}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />{t("roles.detail.editRole")}
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// V2 Tabs Panel - wraps all V2 tabs with shared data loading
function V2TabsPanel({ role }: { role: RoleItem }) {
  const { t } = useTranslation()
  const { data, loading } = useV2RoleData(role.id)
  const tabClass = "h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 data-[state=active]:shadow-none"

  return (
    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
      <div className="border-b px-6">
        <TabsList className="h-12 bg-transparent p-0 gap-6">
          <TabsTrigger value="overview" className={tabClass}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{t("roles.detail.overview")}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="goals" className={tabClass}>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>{t("roles.detail.goals")}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="organization" className={tabClass}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{t("roles.detail.organization")}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="structure" className={tabClass}>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>{t("roles.detail.structure")}</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview" className="flex-1 p-6 mt-0 overflow-hidden">
        <V2OverviewTab role={role} data={data} loading={loading} />
      </TabsContent>
      <TabsContent value="goals" className="flex-1 p-6 mt-0 overflow-auto">
        <V2GoalsTab data={data} loading={loading} />
      </TabsContent>
      <TabsContent value="organization" className="flex-1 p-6 mt-0 overflow-auto">
        <V2OrganizationTab role={role} data={data} loading={loading} />
      </TabsContent>
      <TabsContent value="structure" className="flex-1 p-6 mt-0 overflow-hidden">
        <V2StructureTab role={role} />
      </TabsContent>
    </Tabs>
  )
}

export default function RoleDetailPanel({ selectedRole, onActivate, onUpdate }: Props) {
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const handleAvatarUpload = async () => {
    if (!selectedRole) return
    const result = await window.electronAPI?.dialog.openFile({
      title: "Select Avatar Image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
      properties: ["openFile"],
    })
    if (result?.canceled || !result?.filePaths[0]) return
    setAvatarUploading(true)
    try {
      const res = await window.electronAPI?.uploadRoleAvatar({
        id: selectedRole.id,
        source: selectedRole.source,
        imagePath: result.filePaths[0],
      })
      if (res?.success) setAvatarVersion(v => v + 1)
    } finally {
      setAvatarUploading(false)
    }
  }

  const openEdit = () => {
    if (!selectedRole) return
    setEditName(selectedRole.name)
    setEditDescription(selectedRole.description || "")
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!selectedRole) return
    setEditSaving(true)
    try {
      if (selectedRole.version === "v2") {
        // V2: update Feature name in persona file
        const fileRes = await window.electronAPI?.invoke("resources:readV2RoleFile", {
          roleId: selectedRole.id,
          fileName: "persona.identity.feature",
        })
        if (fileRes?.success) {
          const updated = fileRes.content.replace(/^(Feature:\s*)(.*)$/m, `$1${editName}`)
          await window.electronAPI?.invoke("resources:saveV2RoleFile", {
            roleId: selectedRole.id,
            fileName: "persona.identity.feature",
            content: updated,
          })
        }
      } else {
        // V1: update metadata
        await window.electronAPI?.invoke("resources:updateMetadata", {
          id: selectedRole.id,
          type: "role",
          source: selectedRole.source ?? "user",
          name: editName,
          description: editDescription,
        })
      }
      setEditOpen(false)
      onUpdate?.()
    } catch { /* ignore */ }
    finally { setEditSaving(false) }
  }

  if (!selectedRole) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("roles.detail.selectRole")}</p>
      </div>
    )
  }

  const isV2 = selectedRole.version === "v2"

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <RoleAvatar
                id={selectedRole.id}
                name={selectedRole.name}
                source={selectedRole.source}
                className="h-12 w-12 rounded-xl text-lg"
                refreshKey={avatarVersion}
              />
              {selectedRole.source === "user" && (
                <button
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleAvatarUpload}
                  disabled={avatarUploading}
                  title="Upload avatar"
                >
                  {avatarUploading
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Upload className="h-4 w-4 text-white" />
                  }
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedRole.name}</h2>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  selectedRole.source === "system" ? "bg-blue-100 text-blue-700"
                    : selectedRole.source === "project" ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {t(`roles.filters.${selectedRole.source === "project" ? "plaza" : (selectedRole.source ?? "user")}`)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">ID: {selectedRole.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedRole.source ?? "user") === "user" && (
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {t("roles.detail.editRole")}
              </Button>
            )}
            <Button size="sm" onClick={() => onActivate(selectedRole)}>
              {t("roles.activate")}
            </Button>
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isV2 ? (
          // V2: Four tabs - Overview, Goals, Organization, Structure
          <V2TabsPanel role={selectedRole} />
        ) : (
          // V1: Three sibling tabs - Overview, Structure, Memory
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-6">
              <TabsList className="h-12 bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{t("roles.detail.overview")}</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="structure"
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>{t("roles.detail.structure")}</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="memory"
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>{t("roles.detail.memory")}</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="flex-1 p-6 mt-0 overflow-hidden">
              <V1OverviewTab role={selectedRole} />
            </TabsContent>

            <TabsContent value="structure" className="flex-1 p-6 mt-0 overflow-hidden">
              <V1StructureTab role={selectedRole} />
            </TabsContent>

            <TabsContent value="memory" className="flex-1 flex flex-col min-h-0 p-6 mt-0">
              <MemoryTab roleId={selectedRole.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("roles.detail.editRole")}</DialogTitle>
            <DialogDescription>{selectedRole.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <RoleAvatar
                id={selectedRole.id}
                name={selectedRole.name}
                source={selectedRole.source}
                className="h-16 w-16 rounded-xl text-2xl"
                refreshKey={avatarVersion}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarUpload}
                  disabled={avatarUploading}
                >
                  {avatarUploading
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("common.loading")}</>
                    : <><Upload className="h-3.5 w-3.5 mr-1.5" />{t("roles.detail.uploadAvatar")}</>
                  }
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("roles.detail.editRoleName")}</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {selectedRole.version !== "v2" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("roles.detail.description")}</label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              {t("roles.memory.cancel")}
            </Button>
            <Button size="sm" onClick={handleEditSave} disabled={editSaving || !editName.trim()}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {editSaving ? t("roles.detail.saving") : t("roles.detail.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
