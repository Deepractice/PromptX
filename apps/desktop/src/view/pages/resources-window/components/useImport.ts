import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export type ResourceType = "role" | "tool"
export type RoleVersion = "v1" | "v2"

export interface UseImportOptions {
  defaultResourceType?: ResourceType
  lockedResourceType?: boolean
  enableV2?: boolean
  onSuccess?: () => void
  onClose: () => void
}

export function useImport({ defaultResourceType = "role", lockedResourceType = false, enableV2 = false, onSuccess, onClose }: UseImportOptions) {
  const { t } = useTranslation()
  const [resourceType, setResourceType] = useState<ResourceType>(defaultResourceType)
  const [roleVersion, setRoleVersion] = useState<RoleVersion>("v2")
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    setResourceType(defaultResourceType)
  }, [defaultResourceType])

  const reset = () => {
    setFilePaths([])
    setName("")
    setDescription("")
    setResourceType(defaultResourceType)
    setRoleVersion("v2")
  }

  const selectFiles = async () => {
    try {
      const result = await window.electronAPI?.invoke("dialog:openFile", {
        filters: [
          { name: "ZIP files", extensions: ["zip"] },
          { name: "All files", extensions: ["*"] },
        ],
        properties: ["openFile", "multiSelections"],
      })
      if (result?.filePaths?.length > 0) {
        setFilePaths(result.filePaths)
      }
    } catch {
      toast.error(t("resources.import.messages.fileNotFound"))
    }
  }

  const removeFile = (index: number) => {
    setFilePaths((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = async () => {
    if (filePaths.length === 0) {
      toast.error(t("resources.import.messages.selectFile"))
      return
    }

    setIsImporting(true)
    let successCount = 0
    let failCount = 0
    const isSingle = filePaths.length === 1
    const isV2Role = resourceType === "role" && roleVersion === "v2" && enableV2

    try {
      for (const filePath of filePaths) {
        try {
          const result = isV2Role
            ? await window.electronAPI?.invoke("resources:importV2Role", {
                filePath,
                name: isSingle ? name || undefined : undefined,
                description: isSingle ? description || undefined : undefined,
              })
            : await window.electronAPI?.invoke("resources:import", {
                filePath,
                type: resourceType,
                name: isSingle ? name || undefined : undefined,
                description: isSingle ? description || undefined : undefined,
              })

          if (result?.success) {
            successCount++
          } else {
            failCount++
            toast.error(t(String(result?.message || "resources.import.messages.importFailed")))
          }
        } catch (err) {
          failCount++
          toast.error(t(String(err || "resources.import.messages.importFailed")))
        }
      }

      if (successCount > 0) {
        if (failCount > 0) {
          toast.warning(
            t("resources.import.messages.importPartialSuccess", {
              success: successCount,
              total: filePaths.length,
            })
          )
        } else {
          toast.success(t("resources.import.messages.importSuccess"))
        }
        reset()
        onClose()
        onSuccess?.()
      }
    } catch (error) {
      toast.error(t(String(error)))
    } finally {
      setIsImporting(false)
    }
  }

  const close = () => {
    if (!isImporting) {
      reset()
      onClose()
    }
  }

  return {
    state: { resourceType, roleVersion, filePaths, name, description, isImporting, lockedResourceType },
    actions: { setResourceType, setRoleVersion, selectFiles, removeFile, setName, setDescription, submit, close },
  }
}
