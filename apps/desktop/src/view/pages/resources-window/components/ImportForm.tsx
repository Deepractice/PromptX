import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileArchive, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ResourceType, RoleVersion } from "./useImport"

interface ImportFormProps {
  resourceType: ResourceType
  lockedResourceType: boolean
  roleVersion: RoleVersion
  enableV2: boolean
  filePaths: string[]
  name: string
  description: string
  onResourceTypeChange: (v: ResourceType) => void
  onRoleVersionChange: (v: RoleVersion) => void
  onSelectFiles: () => void
  onRemoveFile: (index: number) => void
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
}

export function ImportForm({
  resourceType, lockedResourceType, roleVersion, enableV2, filePaths, name, description,
  onResourceTypeChange, onRoleVersionChange, onSelectFiles, onRemoveFile,
  onNameChange, onDescriptionChange,
}: ImportFormProps) {
  const { t } = useTranslation()
  const isSingle = filePaths.length <= 1
  const isRole = resourceType === "role"
  // V2 未开启时强制使用 v1
  const effectiveRoleVersion: RoleVersion = enableV2 ? roleVersion : "v1"

  return (
    <div className="space-y-4">
      {/* 资源类型：锁定时只展示标签，不可更改 */}
      {lockedResourceType ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {isRole ? t("resources.types.role") : t("resources.types.tool")}
          </span>
          {/* 角色锁定时，仅 enableV2 时显示 V1/V2 切换 */}
          {isRole && enableV2 && (
            <div className="flex gap-1 rounded-md border p-0.5">
              {(["v1", "v2"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    effectiveRoleVersion === v
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => onRoleVersionChange(v)}
                >
                  {v === "v1" ? "V1 DPML" : "V2 RoleX"}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{t("resources.import.fields.resourceType")}</Label>
          <Select value={resourceType} onValueChange={(v) => onResourceTypeChange(v as ResourceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="role">{t("resources.types.role")}</SelectItem>
              <SelectItem value="tool">{t("resources.types.tool")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 文件选择 */}
      <div className="space-y-2">
        <Label>{t("resources.import.fields.zipFile")}</Label>
        <Button type="button" variant="outline" onClick={onSelectFiles} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {t("resources.import.fields.upload")}
        </Button>
        {filePaths.length > 0 && (
          <ScrollArea className="h-[100px] w-full rounded-md border p-2">
            <div className="space-y-2">
              {filePaths.map((path, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/50 p-2 rounded">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileArchive className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={path}>{path.split(/[\\/]/).pop()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 以下字段仅单文件且非V2角色时显示 */}
      {isSingle && !(isRole && effectiveRoleVersion === "v2") && (
        <>
          <div className="space-y-2">
            <Label>{t("resources.import.fields.customName")}</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("resources.import.fields.customNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("resources.import.fields.customDescription")}</Label>
            <Textarea
              className="overflow-hidden"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={t("resources.import.fields.customDescriptionPlaceholder")}
            />
          </div>
        </>
      )}
    </div>
  )
}
