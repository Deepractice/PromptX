import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Pencil, ArrowDown } from "lucide-react"
import type { RoleItem } from "./RoleListPanel"

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
  activatingId: string | null
  onActivate: (role: RoleItem) => void
}

export default function RoleDetailPanel({ selectedRole, activatingId, onActivate }: Props) {
  const { t } = useTranslation()

  if (!selectedRole) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">{t("roles.detail.selectRole")}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {selectedRole.version === "v2" ? "V2 Rolex" : "V1 DPML"}
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
              onClick={() => onActivate(selectedRole)}
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
              <TabsTrigger value="structure" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
                {t("roles.detail.structure")}
              </TabsTrigger>
              <TabsTrigger value="memory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-1 pb-2.5 pt-2">
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
              {/* Source info */}
              <div className="flex gap-2 mt-4">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                  {selectedRole.source ?? "user"}
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
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
    </div>
  )
}
