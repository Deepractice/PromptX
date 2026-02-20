import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save, X } from "lucide-react"

type Props = {
  name: string
  description: string
  onClose: () => void
  onSave: (name: string, description: string) => Promise<void>
}

export default function EditInfoDialog({ name, description, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [editName, setEditName] = useState(name)
  const [editDescription, setEditDescription] = useState(description)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editName.trim(), editDescription.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl shadow-xl w-[420px] border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">{t("tools.detail.editInfo")}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">{t("tools.detail.editName")}</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("tools.detail.namePlaceholder")}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">{t("tools.detail.editDescription")}</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t("tools.detail.descriptionPlaceholder")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] resize-y outline-none focus:ring-1 focus:ring-ring"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("tools.detail.cancel")}
          </Button>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSave}
            disabled={saving || !editName.trim()}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {t("tools.detail.save")}
          </Button>
        </div>
      </div>
    </div>
  )
}
