import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, ChevronRight, ChevronDown, Building2, Users } from "lucide-react"
import RoleAvatar from "./RoleAvatar"
import { useState } from "react"

type RoleItem = {
  id: string
  name: string
  description?: string
  type: "role"
  source?: string
  version?: "v1" | "v2"
  org?: string
  position?: string
}

type OrganizationNode = {
  name: string
  charter?: string
  roles: RoleItem[]
}

type VersionFilter = "v1" | "v2"
type SourceFilter = "all" | "system" | "plaza" | "user"

type Props = {
  loading: boolean
  filteredRoles: RoleItem[]
  organizations: OrganizationNode[]
  versionFilter: VersionFilter
  setVersionFilter: (v: VersionFilter) => void
  versionStats: { v1: number; v2: number }
  sourceFilter: SourceFilter
  setSourceFilter: (f: SourceFilter) => void
  sourceStats: { system: number; plaza: number; user: number }
  query: string
  setQuery: (q: string) => void
  selectedRole: RoleItem | null
  setSelectedRole: (r: RoleItem) => void
  enableV2?: boolean
}

export default function RoleTreeListPanel({
  loading, filteredRoles, organizations, versionFilter, setVersionFilter, versionStats,
  sourceFilter, setSourceFilter, sourceStats, query, setQuery,
  selectedRole, setSelectedRole, enableV2 = true,
}: Props) {
  const { t } = useTranslation()
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())

  const toggleOrg = (orgName: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(orgName)) {
        next.delete(orgName)
      } else {
        next.add(orgName)
      }
      return next
    })
  }

  // 分离有组织的角色和无组织的角色
  const rolesWithOrg = filteredRoles.filter(r => r.org)
  const rolesWithoutOrg = filteredRoles.filter(r => !r.org)

  // 按组织分组
  const orgMap = new Map<string, RoleItem[]>()
  rolesWithOrg.forEach(role => {
    if (role.org) {
      if (!orgMap.has(role.org)) {
        orgMap.set(role.org, [])
      }
      orgMap.get(role.org)!.push(role)
    }
  })

  // 获取组织信息
  const getOrgInfo = (orgName: string) => {
    return organizations.find(o => o.name === orgName)
  }

  const renderRole = (role: RoleItem) => (
    <button
      key={`${role.source}-${role.id}`}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        selectedRole?.id === role.id && selectedRole?.source === role.source
          ? "bg-accent border border-border"
          : "hover:bg-muted"
      }`}
      onClick={() => setSelectedRole(role)}
    >
      <RoleAvatar
        id={role.id}
        name={role.name}
        source={role.source}
        className="h-9 w-9 rounded-lg text-sm"
      />
      <div className="w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{role.name}</span>
          {role.position && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700">
              {role.position}
            </span>
          )}
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            role.source === "system"
              ? "bg-blue-100 text-blue-700"
              : role.source === "project"
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}>
            {t(`roles.filters.${role.source === "project" ? "plaza" : (role.source ?? "user")}`)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {role.description || t("roles.noDescription")}
        </p>
      </div>
    </button>
  )

  return (
    <div className="w-[320px] border-r flex flex-col bg-muted/30 overflow-hidden">
      <div className="p-3 space-y-2">
        {enableV2 ? (
          <>
            {/* V2 enabled: V1/V2 toggle → source filter → search */}
            <div className="flex gap-1">
              {(["v1", "v2"] as const).map((v) => (
                <button
                  key={v}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    versionFilter === v
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => { setVersionFilter(v); setSourceFilter("all") }}
                >
                  {v === "v1" ? "V1 DPML" : "V2 Rolex"}
                  <span className="ml-1 opacity-70">({versionStats[v]})</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["all", "system", "plaza", "user"] as const).map((f) => (
                <button
                  key={f}
                  className={`flex-1 rounded-md px-1 py-0.5 text-[10px] transition-colors ${
                    sourceFilter === f
                      ? "bg-foreground/80 text-background"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSourceFilter(f)}
                >
                  {t(`roles.filters.${f}`)}
                  {f !== "all" && <span className="ml-0.5 opacity-70">({sourceStats[f]})</span>}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("roles.search.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            {/* V2 disabled: search → source filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("roles.search.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "system", "plaza", "user"] as const).map((f) => (
                <button
                  key={f}
                  className={`flex-1 rounded-md px-1.5 py-1 text-[11px] transition-colors ${
                    sourceFilter === f
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setSourceFilter(f)}
                >
                  {t(`roles.filters.${f}`)}
                  {f !== "all" && <span className="ml-0.5 opacity-70">({sourceStats[f]})</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1">
          {loading && filteredRoles.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t("roles.empty")}
            </div>
          ) : versionFilter === "v2" ? (
            <>
              {/* V2 角色：显示组织树状结构，合并 organizations prop 和 filteredRoles */}
              {(() => {
                // 合并所有组织：来自 organizations prop + filteredRoles 中的 org
                const allOrgNames = new Set<string>()
                organizations.forEach(o => allOrgNames.add(o.name))
                orgMap.forEach((_, orgName) => allOrgNames.add(orgName))

                return Array.from(allOrgNames).map(orgName => {
                  const orgInfo = getOrgInfo(orgName)
                  const orgRoles = orgMap.get(orgName) || []
                  // 组织来自 directory 但下面没有匹配到的角色时，显示 directory 中的成员信息
                  const directoryMembers = orgInfo?.roles || []
                  const displayRoles = orgRoles.length > 0 ? orgRoles : directoryMembers
                  const isExpanded = expandedOrgs.has(orgName)
                  return (
                    <div key={orgName} className="mb-2">
                      <button
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/80 bg-muted/50"
                        onClick={() => toggleOrg(orgName)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{orgName}</span>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {displayRoles.length}
                            </span>
                          </div>
                          {orgInfo?.charter && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {orgInfo.charter}
                            </p>
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-2">
                          {displayRoles.map(role => renderRole(role))}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}

              {/* 无组织的 V2 角色 */}
              {rolesWithoutOrg.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{t("roles.filters.independent")}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                      {rolesWithoutOrg.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rolesWithoutOrg.map(role => renderRole(role))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* V1 角色：平面列表 */
            filteredRoles.map(role => renderRole(role))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export type { RoleItem, VersionFilter, SourceFilter, OrganizationNode }
