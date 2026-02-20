import { useTranslation } from "react-i18next"
import type { ToolItem } from "./ToolListPanel"

type Props = {
  tool: ToolItem
  toolManual: string | null
}

export default function ToolOverviewTab({ tool, toolManual }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium mb-2">{t("tools.detail.description")}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{tool.description || t("tools.noDescription")}</p>
      </div>
      {tool.tags && tool.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">{t("tools.detail.tags")}</h3>
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{tag}</span>
            ))}
          </div>
        </div>
      )}
      {toolManual && (
        <div>
          <h3 className="text-sm font-medium mb-2">{t("tools.detail.manual")}</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{toolManual}</pre>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-medium mb-2">{t("tools.detail.info")}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <span className="text-muted-foreground">{t("tools.detail.source")}</span>
            <p className="font-medium mt-0.5">{tool.source ?? "user"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <span className="text-muted-foreground">ID</span>
            <p className="font-medium mt-0.5 font-mono text-xs">{tool.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
