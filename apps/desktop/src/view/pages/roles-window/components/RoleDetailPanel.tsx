import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, ArrowDown } from "lucide-react"
import { useEffect, useState } from "react"
import type { RoleItem } from "./RoleListPanel"
import MemoryTab from "./MemoryTab"

const AVATAR_COLORS = [
  "from-gray-600 to-gray-800",
  "from-slate-500 to-slate-700",
  "from-zinc-500 to-zinc-700",
  "from-neutral-500 to-neutral-700",
  "from-stone-500 to-stone-700",
  "from-gray-500 to-gray-700",
  "from-slate-600 to-slate-800",
  "from-zinc-600 to-zinc-800",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

type Props = {
  selectedRole: RoleItem | null
  onActivate: (role: RoleItem) => void
}

// V1 Role Overview Tab Content
function V1OverviewContent({ role, promptContent, loadingPrompt }: {
  role: RoleItem
  promptContent: string
  loadingPrompt: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">{t("roles.detail.description")}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {role.description || t("roles.noDescription")}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">{t("roles.detail.prompt")}</h3>
        <div className="rounded-lg bg-muted/50 p-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {loadingPrompt ? (
            <p className="text-sm text-muted-foreground">{t("roles.detail.promptLoading")}</p>
          ) : (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {promptContent}
            </pre>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
          {role.source ?? "user"}
        </span>
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
          {role.type}
        </span>
      </div>
    </div>
  )
}

// V1 Role Structure Tab Content (DPML Architecture)
function V1StructureContent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">{t("roles.detail.architecture")}</h3>
        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-xs rounded-lg bg-foreground px-4 py-3 text-center text-background text-sm font-medium">
              Personality Layer
            </div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="w-full max-w-xs rounded-lg bg-foreground/80 px-4 py-3 text-center text-background text-sm font-medium">
              Principle Layer
            </div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="w-full max-w-xs rounded-lg bg-foreground/60 px-4 py-3 text-center text-background text-sm font-medium">
              Knowledge Layer
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-1">Personality Layer</h4>
          <p className="text-xs text-muted-foreground">Defines the character traits, speaking style, and behavioral patterns of the role.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-1">Principle Layer</h4>
          <p className="text-xs text-muted-foreground">Core principles and guidelines that govern the role&apos;s decision-making process.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-1">Knowledge Layer</h4>
          <p className="text-xs text-muted-foreground">Domain-specific knowledge and factual information the role can access.</p>
        </div>
      </div>
    </div>
  )
}

export default function RoleDetailPanel({ selectedRole, onActivate }: Props) {
  const { t } = useTranslation()
  const [promptContent, setPromptContent] = useState<string>("")
  const [loadingPrompt, setLoadingPrompt] = useState(false)

  useEffect(() => {
    if (!selectedRole || selectedRole.version === "v2") {
      setPromptContent("")
      return
    }

    const fetchPrompt = async () => {
      setLoadingPrompt(true)
      try {
        const res = await window.electronAPI?.getRolePrompt(selectedRole.id, selectedRole.source || "user")
        if (res?.success && res.prompt) {
          setPromptContent(res.prompt)
        } else {
          setPromptContent(t("roles.detail.promptError") || "Failed to load prompt")
        }
      } catch (e) {
        setPromptContent(t("roles.detail.promptError") || "Failed to load prompt")
      } finally {
        setLoadingPrompt(false)
      }
    }

    fetchPrompt()
  }, [selectedRole, t])

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
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(selectedRole.name)} text-white text-lg font-bold`}>
              {getInitial(selectedRole.name)}
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
              <Button variant="outline" size="sm">
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue={isV2 ? "structure" : "overview"} className="flex-1 flex flex-col min-h-0">
          <div className="border-b px-6">
            <TabsList className="h-10 bg-transparent p-0 gap-4">
              {!isV2 && (
                <>
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                    {t("roles.detail.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                    {t("roles.detail.structure")}
                  </TabsTrigger>
                  <TabsTrigger value="memory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                    {t("roles.detail.memory")}
                  </TabsTrigger>
                </>
              )}
              {isV2 && (
                <TabsTrigger value="structure" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                  {t("roles.detail.structure")}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {!isV2 && (
            <TabsContent value="overview" className="flex-1 p-6 mt-0 overflow-auto scrollbar-hide">
              <V1OverviewContent
                role={selectedRole}
                promptContent={promptContent}
                loadingPrompt={loadingPrompt}
              />
            </TabsContent>
          )}

          <TabsContent value="structure" className="flex-1 p-6 mt-0 overflow-auto scrollbar-hide">
            {isV2 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">{t("roles.detail.description")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRole.description || t("roles.noDescription")}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                    {selectedRole.source ?? "user"}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                    {selectedRole.type}
                  </span>
                </div>
              </div>
            ) : (
              <V1StructureContent />
            )}
          </TabsContent>

          {!isV2 && (
            <TabsContent value="memory" className="flex-1 flex flex-col min-h-0 p-6 mt-0">
              <MemoryTab roleId={selectedRole.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
