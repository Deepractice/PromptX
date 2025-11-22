import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileArchive, X } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResourceImporterProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: () => void
}

export function ResourceImporter({ isOpen, onClose, onImportSuccess }: ResourceImporterProps) {
  const { t } = useTranslation()
  const [importType, setImportType] = useState<"file" | "url">("file")
  const [resourceType, setResourceType] = useState<"role" | "tool">("role")
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [customId, setCustomId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleFileSelect = async () => {
    try {
      // 使用Electron的dialog选择文件
      const result = await window.electronAPI?.invoke("dialog:openFile", {
        filters: [
          { name: "ZIP files", extensions: ["zip"] },
          { name: "All files", extensions: ["*"] }
        ],
        properties: ["openFile", "multiSelections"]
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        setFilePaths(result.filePaths)
      }
    } catch (error) {
      console.error("Failed to select file:", error)
      toast.error(t('resources.import.messages.fileNotFound'))
    }
  }

  const removeFile = (index: number) => {
    setFilePaths(prev => prev.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    if (importType === "file" && filePaths.length === 0) {
      toast.error(t('resources.import.messages.selectFile'))
      return
    }

    setIsImporting(true)
    let successCount = 0
    let failCount = 0

    try {
      const isSingle = filePaths.length === 1

      for (const filePath of filePaths) {
        try {
          const result = await window.electronAPI?.invoke("resources:import", {
            filePath,
            type: resourceType,
            customId: isSingle ? (customId || undefined) : undefined,
            name: isSingle ? (name || undefined) : undefined,
            description: isSingle ? (description || undefined) : undefined
          })

          if (result?.success) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to import ${filePath}:`, result?.message)
          }
        } catch (err) {
          failCount++
          console.error(`Error importing ${filePath}:`, err)
        }
      }

      if (successCount > 0) {
        if (failCount > 0) {
          toast.warning(t('resources.import.messages.importPartialSuccess', { success: successCount, total: filePaths.length }))
        } else {
          toast.success(t('resources.import.messages.importSuccess'))
        }
        resetForm()
        onClose()
        onImportSuccess?.()
      } else {
        toast.error(t('resources.import.messages.importFailed'))
      }
    } catch (error) {
      console.error("Import process failed:", error)
      toast.error(t('resources.import.messages.importFailed'))
    } finally {
      setIsImporting(false)
    }
  }

  const resetForm = () => {
    setFilePaths([])
    setCustomId("")
    setName("")
    setDescription("")
    setImportType("file")
    setResourceType("role")
  }

  const handleClose = () => {
    if (!isImporting) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('resources.import.title')}</DialogTitle>
          <DialogDescription>
            {t('resources.import.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 导入方式选择 */}
          <Tabs value={importType} onValueChange={(v) => setImportType(v as "file" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="border border-black">{t('resources.import.methods.file')}</TabsTrigger>
              <TabsTrigger value="url" disabled>
                {t('resources.import.methods.url')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              {/* 资源类型 */}
              <div className="space-y-2">
                <Label>{t('resources.import.fields.resourceType')}</Label>
                <Select value={resourceType} onValueChange={(v) => setResourceType(v as "role" | "tool")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="role">{t('resources.types.role')}</SelectItem>
                    <SelectItem value="tool">{t('resources.types.tool')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 文件选择 */}
              <div className="space-y-2">
                <Label>{t('resources.import.fields.zipFile')}</Label>
                <Button type="button" variant="outline" onClick={handleFileSelect} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('resources.import.fields.upload')}
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
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* 自定义ID（可选） - 仅单文件时可用 */}
              {filePaths.length <= 1 && (
                <div className="space-y-2">
                  <Label>
                    {t('resources.import.fields.customId')}
                  </Label>
                  <Input
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={t('resources.import.fields.customIdPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('resources.import.fields.customIdHint')}
                  </p>
                </div>
              )}

              {/* 自定义名称（可选） - 仅单文件时可用 */}
              {filePaths.length <= 1 && (
                <div className="space-y-2">
                  <Label>
                    {t('resources.import.fields.customName')}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('resources.import.fields.customNamePlaceholder')}
                  />
                </div>
              )}

              {/* 自定义描述（可选） - 仅单文件时可用 */}
              {filePaths.length <= 1 && (
                <div className="space-y-2 w-full">
                  <Label>
                    {t('resources.import.fields.customDescription')}
                  </Label>
                  <Textarea className="overflow-hidden"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('resources.import.fields.customDescriptionPlaceholder')}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url">
              <div className="text-center py-8 text-muted-foreground">
                {t('resources.import.urlComingSoon')}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {t('resources.import.actions.cancel')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || (importType === "file" && filePaths.length === 0)}
            className="text-white"
          >
            {isImporting ? t('resources.import.actions.importing') : t('resources.import.actions.import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
