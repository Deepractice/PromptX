import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast, Toaster } from "sonner"
import { goToSendMessage } from "../../../utils/goToSendMessage"
import RoleListPanel from "./components/RoleListPanel"
import RoleDetailPanel from "./components/RoleDetailPanel"
import type { RoleItem, VersionFilter, SourceFilter } from "./components/RoleListPanel"
export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [query, setQuery] = useState("")
  const [versionFilter, setVersionFilter] = useState<VersionFilter>("v2")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null)
  const [enableV2, setEnableV2] = useState(true)

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roles.filter((item) => {
      const isV2 = item.version === "v2"
      const versionOk =
        (versionFilter === "v1" && !isV2) ||
        (versionFilter === "v2" && isV2)
      const src = item.source ?? "user"
      const sourceOk = sourceFilter === "all" ||
        src === (sourceFilter === "plaza" ? "project" : sourceFilter)
      const queryOk =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      return versionOk && sourceOk && queryOk
    })
  }, [roles, versionFilter, sourceFilter, query])

  const versionStats = useMemo(() => {
    let v1 = 0, v2 = 0
    roles.forEach((r) => {
      if (r.version === "v2") v2++
      else v1++
    })
    return { v1, v2 }
  }, [roles])

  const sourceStats = useMemo(() => {
    const stats = { system: 0, plaza: 0, user: 0 }
    roles.forEach((r) => {
      const isV2 = r.version === "v2"
      if ((versionFilter === "v1" && isV2) || (versionFilter === "v2" && !isV2)) return
      const src = r.source ?? "user"
      if (src === "project") stats.plaza++
      else if (src in stats) stats[src as keyof typeof stats]++
    })
    return stats
  }, [roles, versionFilter])

  const loadRoles = async (v2Enabled?: boolean) => {
    const useV2 = v2Enabled !== undefined ? v2Enabled : enableV2
    setLoading(true)
    try {
      const result = await window.electronAPI?.getGroupedResources()
      if (result?.success) {
        const { grouped } = result.data || {}
        const flat: RoleItem[] = []
        Object.keys(grouped || {}).forEach((source) => {
          const group = grouped[source] || {}
          ;(group.roles || []).forEach((role: any) =>
            flat.push({
              id: role.id || role.name,
              name: role.name,
              description: role.description,
              type: "role",
              source,
              version: role.version || "v1",
            })
          )
        })
        setRoles(flat)
        if (flat.length > 0 && !selectedRole) {
          if (useV2) {
            const firstV2 = flat.find((r) => r.version === "v2")
            setSelectedRole(firstV2 ?? flat[0] ?? null)
          } else {
            const firstV1 = flat.find((r) => r.version !== "v2")
            setSelectedRole(firstV1 ?? flat[0] ?? null)
          }
        }
      } else {
        toast.error(t("roles.messages.loadFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("roles.messages.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = (role: RoleItem) => {
    goToSendMessage(t("roles.messages.activatePrompt", { name: role.name }), { roleResources: "all" })
  }

  const handleDelete = async (role: RoleItem) => {
    if ((role.source ?? "user") === "system") {
      toast.error(t("roles.messages.deleteOnlyUser"))
      return
    }
    const ok = window.confirm(t("roles.messages.deleteConfirm", { name: role.name }))
    if (!ok) return
    try {
      const res = await window.electronAPI?.invoke("resources:delete", {
        id: role.id, type: "role", source: role.source ?? "user", version: role.version ?? "v1",
      })
      if (res?.success) {
        toast.success(t("roles.messages.deleteSuccess", { name: role.name }))
        if (selectedRole?.id === role.id) setSelectedRole(null)
        loadRoles()
      } else {
        toast.error(res?.message || t("roles.messages.deleteFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("roles.messages.deleteFailed"))
    }
  }

  useEffect(() => {
    const init = async () => {
      const config = await window.electronAPI?.invoke("server-config:get")
      const v2Enabled = config?.enableV2 !== false
      setEnableV2(v2Enabled)
      if (!v2Enabled) setVersionFilter("v1")
      await loadRoles(v2Enabled)
    }
    init()
  }, [])

  return (
    <div className="flex h-full">
      <Toaster />
      <RoleListPanel
        loading={loading}
        filteredRoles={filteredRoles}
        versionFilter={versionFilter}
        setVersionFilter={setVersionFilter}
        versionStats={versionStats}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        sourceStats={sourceStats}
        query={query}
        setQuery={setQuery}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        enableV2={enableV2}
      />
      <RoleDetailPanel
        selectedRole={selectedRole}
        onActivate={handleActivate}
        onDelete={handleDelete}
        onUpdate={loadRoles}
      />
    </div>
  )
}
