import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast, Toaster } from "sonner"
import {
  Search,
  Loader2,
  Pencil,
  ArrowDown,
} from "lucide-react"

type RoleItem = {
  id: string
  name: string
  description?: string
  type: "role"
  source?: string
}

const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-green-400 to-green-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
  "from-rose-400 to-rose-600",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null)

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roles.filter((item) => {
      const queryOk =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      return queryOk
    })
  }, [roles, query])

  const loadRoles = async () => {
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
            })
          )
        })
        setRoles(flat)
        if (flat.length > 0 && !selectedRole) setSelectedRole(flat[0] ?? null)
      } else {
        toast.error(t("roles.messages.loadFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("roles.messages.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (role: RoleItem) => {
    setActivatingId(role.id)
    try {
      const result = await window.electronAPI?.activateRole(role.id)
      if (result?.success) {
        toast.success(t("roles.messages.activateSuccess", { name: role.name }))
      } else {
        toast.error(result?.message || t("roles.messages.activateFailed"))
      }
    } catch (e: any) {
      toast.error(e?.message || t("roles.messages.activateFailed"))
    } finally {
      setActivatingId(null)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  return (
    <div className="flex h-full">
      <Toaster />
      {/* Left Panel - Role List */}
      <div className="w-[280px] border-r flex flex-col bg-muted/30">
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("roles.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-1">
            {loading && roles.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                {t("roles.empty")}
              </div>
            ) : (
              filteredRoles.map((role) => (
                <button
                  key={`${role.source}-${role.id}`}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selectedRole?.id === role.id && selectedRole?.source === role.source
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(role.name)} text-white text-sm font-semibold`}>
                    {getInitial(role.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{role.name}</span>
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        {role.source === "system" ? "V1" : "V2"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {role.description || t("roles.noDescription")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Role Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedRole ? (
          <>
            {/* Detail Header */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(selectedRole.name)} text-white text-lg font-bold`}>
                    {getInitial(selectedRole.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{selectedRole.name}</h2>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {selectedRole.source === "system" ? "V1 DPML" : "V2 Bot"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {selectedRole.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    {t("roles.detail.editRole")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={activatingId === selectedRole.id}
                    onClick={() => handleActivate(selectedRole)}
                  >
                    {activatingId === selectedRole.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : null}
                    {t("roles.activate")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Detail Content with Tabs */}
            <div className="flex-1 overflow-auto">
              <Tabs defaultValue="structure" className="h-full">
                <div className="border-b px-6">
                  <TabsList className="h-10 bg-transparent p-0 gap-4">
                    <TabsTrigger value="structure" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                      {t("roles.detail.structure")}
                    </TabsTrigger>
                    <TabsTrigger value="memory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                      {t("roles.detail.memory")}
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="structure" className="p-6 mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">{t("roles.detail.description")}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedRole.description || t("roles.noDescription")}
                      </p>
                    </div>
                    {/* DPML Architecture Diagram */}
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-3">{t("roles.detail.architecture")}</h3>
                      <div className="rounded-lg border bg-muted/30 p-6">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-full max-w-xs rounded-lg bg-blue-500 px-4 py-3 text-center text-white text-sm font-medium">
                            Personality Layer
                          </div>
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          <div className="w-full max-w-xs rounded-lg bg-green-500 px-4 py-3 text-center text-white text-sm font-medium">
                            Principle Layer
                          </div>
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          <div className="w-full max-w-xs rounded-lg bg-purple-500 px-4 py-3 text-center text-white text-sm font-medium">
                            Knowledge Layer
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Source info */}
                    <div className="flex gap-2 mt-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedRole.source ?? "user"}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-gray-50 text-gray-600 border border-gray-200">
                        {selectedRole.type}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="memory" className="p-6 mt-0">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">{t("roles.detail.memoryEmpty")}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">{t("roles.detail.selectRole")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
