import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Loader2, Plus, Pencil, Trash2, Check } from "lucide-react"
import { toast } from "sonner"

interface AgentXProfile {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
}

const EMPTY_FORM = {
  name: "",
  apiKey: "",
  baseUrl: "https://api.anthropic.com",
  model: "claude-sonnet-4-20250514",
}

export function AgentXProfilesConfig() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState<AgentXProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => { loadProfiles() }, [])

  const loadProfiles = async () => {
    const config = await window.electronAPI?.agentx.getConfig()
    if (config) {
      setProfiles((config as any).profiles ?? [])
      setActiveProfileId((config as any).activeProfileId)
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setConnectionStatus("idle")
    setDialogOpen(true)
  }

  const openEdit = (p: AgentXProfile) => {
    setEditingId(p.id)
    setForm({ name: p.name, apiKey: p.apiKey, baseUrl: p.baseUrl, model: p.model })
    setConnectionStatus("idle")
    setDialogOpen(true)
  }

  const handleActivate = async (id: string) => {
    const config = await window.electronAPI?.agentx.getConfig()
    await window.electronAPI?.agentx.updateConfig({ ...(config as any), activeProfileId: id })
    setActiveProfileId(id)
    toast.success(t("settings.agentx.profiles.activated"))
  }

  const handleDelete = async (id: string) => {
    const config = await window.electronAPI?.agentx.getConfig()
    const newProfiles = ((config as any).profiles ?? []).filter((p: AgentXProfile) => p.id !== id)
    const newActiveId = (config as any).activeProfileId === id ? newProfiles[0]?.id : (config as any).activeProfileId
    await window.electronAPI?.agentx.updateConfig({ ...(config as any), profiles: newProfiles, activeProfileId: newActiveId })
    setProfiles(newProfiles)
    setActiveProfileId(newActiveId)
    toast.success(t("settings.agentx.profiles.deleted"))
  }

  const handleTest = async () => {
    setIsTesting(true)
    setConnectionStatus("idle")
    try {
      const result = await window.electronAPI?.agentx.testConnection({
        apiKey: form.apiKey,
        baseUrl: form.baseUrl,
        model: form.model,
      })
      setConnectionStatus(result?.success ? "success" : "error")
      if (!result?.success) toast.error(result?.error ?? t("settings.agentx.testFailed"))
    } catch {
      setConnectionStatus("error")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.apiKey) return
    setIsSaving(true)
    try {
      const config = await window.electronAPI?.agentx.getConfig()
      const existing: AgentXProfile[] = (config as any).profiles ?? []
      let newProfiles: AgentXProfile[]
      let newActiveId = (config as any).activeProfileId as string | undefined

      if (editingId) {
        newProfiles = existing.map(p => p.id === editingId ? { ...p, ...form } : p)
      } else {
        const newProfile: AgentXProfile = { id: crypto.randomUUID(), ...form }
        newProfiles = [...existing, newProfile]
        if (!newActiveId) newActiveId = newProfile.id
      }

      await window.electronAPI?.agentx.updateConfig({ ...(config as any), profiles: newProfiles, activeProfileId: newActiveId })
      setProfiles(newProfiles)
      setActiveProfileId(newActiveId)
      setDialogOpen(false)
      toast.success(t("settings.agentx.profiles.saved"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {profiles.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{t("settings.agentx.profiles.empty")}</p>
      ) : (
        profiles.map(profile => (
          <div key={profile.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{profile.name}</span>
                {profile.id === activeProfileId && (
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t("settings.agentx.profiles.active")}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{profile.baseUrl} · {profile.model}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {profile.id !== activeProfileId && (
                <Button size="sm" variant="ghost" title={t("settings.agentx.profiles.activate")} onClick={() => handleActivate(profile.id)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => openEdit(profile)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" disabled={profiles.length === 1} onClick={() => handleDelete(profile.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={openAdd}>
        <Plus className="mr-2 h-4 w-4" />
        {t("settings.agentx.profiles.add")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("settings.agentx.profiles.editTitle") : t("settings.agentx.profiles.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("settings.agentx.profiles.name")}</Label>
              <Input
                value={form.name}
                placeholder="My Config"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.agentx.apiKey.label")}</Label>
              <Input
                type="password"
                value={form.apiKey}
                placeholder={t("settings.agentx.apiKey.placeholder")}
                onChange={e => { setForm(f => ({ ...f, apiKey: e.target.value })); setConnectionStatus("idle") }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.agentx.baseUrl.label")}</Label>
              <Input
                value={form.baseUrl}
                placeholder={t("settings.agentx.baseUrl.placeholder")}
                onChange={e => { setForm(f => ({ ...f, baseUrl: e.target.value })); setConnectionStatus("idle") }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.agentx.model.label")}</Label>
              <Input
                value={form.model}
                placeholder={t("settings.agentx.model.placeholder")}
                onChange={e => { setForm(f => ({ ...f, model: e.target.value })); setConnectionStatus("idle") }}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" disabled={isTesting || !form.apiKey} onClick={handleTest}>
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isTesting ? t("settings.agentx.testing") : t("settings.agentx.testConnection")}
            </Button>
            {connectionStatus === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            <div className="flex-1" />
            <Button disabled={isSaving || !form.name || !form.apiKey} onClick={handleSave}>
              {isSaving ? t("settings.agentx.saving") : t("settings.agentx.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
