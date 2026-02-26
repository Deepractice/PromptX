import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { ImportForm } from "./ImportForm"
import { useImport } from "./useImport"
import type { ResourceType } from "./useImport"

interface ResourceImporterProps {
  isOpen: boolean
  onClose: () => void
  defaultResourceType?: ResourceType
  lockedResourceType?: boolean
  enableV2?: boolean
  onImportSuccess?: () => void
}

export function ResourceImporter({
  isOpen, onClose, defaultResourceType, lockedResourceType = false, enableV2 = false, onImportSuccess,
}: ResourceImporterProps) {
  const { t } = useTranslation()
  const { state, actions } = useImport({
    defaultResourceType,
    lockedResourceType,
    enableV2,
    onSuccess: onImportSuccess,
    onClose,
  })

  return (
    <Dialog open={isOpen} onOpenChange={actions.close}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("resources.import.title")}</DialogTitle>
          <DialogDescription>{t("resources.import.description")}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ImportForm
            resourceType={state.resourceType}
            lockedResourceType={state.lockedResourceType}
            roleVersion={state.roleVersion}
            enableV2={enableV2}
            filePaths={state.filePaths}
            name={state.name}
            description={state.description}
            onResourceTypeChange={actions.setResourceType}
            onRoleVersionChange={actions.setRoleVersion}
            onSelectFiles={actions.selectFiles}
            onRemoveFile={actions.removeFile}
            onNameChange={actions.setName}
            onDescriptionChange={actions.setDescription}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={actions.close} disabled={state.isImporting}>
            {t("resources.import.actions.cancel")}
          </Button>
          <Button
            onClick={actions.submit}
            disabled={state.isImporting || state.filePaths.length === 0}
            className="text-white"
          >
            {state.isImporting ? t("resources.import.actions.importing") : t("resources.import.actions.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
