import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type ResourceItem = {
  id: string
  name: string
  description?: string
  type: "role" | "tool"
  source?: string
}

interface ResourceEditorProps {
  isOpen: boolean
  onClose: () => void
  editingItem: ResourceItem | null
  onResourceUpdated: () => void
}

export default function ResourceEditor({ isOpen, onClose, editingItem, onResourceUpdated }: ResourceEditorProps) {
  const { t } = useTranslation()
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [fileList, setFileList] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileContentLoading, setFileContentLoading] = useState(false)

  // 资源信息编辑状态
  const [editingName, setEditingName] = useState<string>("")
  const [editingDescription, setEditingDescription] = useState<string>("")
  const [resourceInfoChanged, setResourceInfoChanged] = useState(false)

  // 当编辑项改变时，初始化状态
  useEffect(() => {
    if (editingItem && isOpen) {
      setEditingName(editingItem.name || "")
      setEditingDescription(editingItem.description || "")
      setResourceInfoChanged(false)
      loadFiles()
    }
  }, [editingItem, isOpen])

  const loadFiles = async () => {
    if (!editingItem) return
    
    setEditorLoading(true)
    setEditorError(null)

    try {
      const res = await window.electronAPI?.invoke("resources:listFiles", {
        id: editingItem.id,
        type: editingItem.type,
        source: editingItem.source ?? "user"
      })
      if (!res?.success) throw new Error(res?.message || "加载文件列表失败")
      const files: string[] = res.files || []
      setFileList(files)
      const initial = files[0] || null
      setSelectedFile(initial)
      if (initial) {
        const fr = await window.electronAPI?.invoke("resources:readFile", {
          id: editingItem.id,
          type: editingItem.type,
          source: editingItem.source ?? "user",
          relativePath: initial
        })
        if (!fr?.success) throw new Error(fr?.message || "读取文件失败")
        setFileContent(fr.content || "")
      } else {
        setFileContent("")
      }
    } catch (e: any) {
      setEditorError(e?.message || "打开编辑器失败")
    } finally {
      setEditorLoading(false)
    }
  }

  const handleSelectFile = async (relativePath: string) => {
    if (!editingItem) return
    setSelectedFile(relativePath)
    setFileContentLoading(true)
    setEditorError(null)
    try {
      const fr = await window.electronAPI?.invoke("resources:readFile", {
        id: editingItem.id,
        type: editingItem.type,
        source: editingItem.source ?? "user",
        relativePath
      })
      if (!fr?.success) throw new Error(fr?.message || t("resources.editor.messages.readFileFailed"))
      setFileContent(fr.content || "")
    } catch (e: any) {
      setEditorError(e?.message || t("resources.editor.messages.readFileFailed"))
      setFileContent("")
    } finally {
      setFileContentLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!editingItem || !selectedFile) return
    if ((editingItem.source ?? "user") !== "user") {
      toast.error(t("resources.editor.messages.onlyUserEditable"))
      return
    }
    setEditorLoading(true)
    setEditorError(null)
    try {
      const sr = await window.electronAPI?.invoke("resources:saveFile", {
        id: editingItem.id,
        type: editingItem.type,
        source: editingItem.source ?? "user",
        relativePath: selectedFile,
        content: fileContent
      })
      if (!sr?.success) throw new Error(sr?.message || t("resources.editor.messages.saveFailed"))
      toast.success(t("resources.editor.messages.saveSuccess"))
    } catch (e: any) {
      setEditorError(e?.message || t("resources.editor.messages.saveFailed"))
    } finally {
      setEditorLoading(false)
    }
  }

  const handleSaveResourceInfo = async () => {
    if (!editingItem) return
    if ((editingItem.source ?? "user") !== "user") {
      toast.error(t("resources.editor.messages.onlyUserEditable"))
      return
    }
    setEditorLoading(true)
    setEditorError(null)
    try {
      const sr = await window.electronAPI?.invoke("resources:updateMetadata", {
        id: editingItem.id,
        type: editingItem.type,
        source: editingItem.source ?? "user",
        name: editingName,
        description: editingDescription
      })
      if (!sr?.success) throw new Error(sr?.message || t("resources.editor.messages.saveFailed"))

      setResourceInfoChanged(false)
      onResourceUpdated()
      toast.success(t("resources.editor.messages.resourceInfoSaveSuccess"))
    } catch (e: any) {
      setEditorError(e?.message || t("resources.editor.messages.saveResourceInfoFailed"))
    } finally {
      setEditorLoading(false)
    }
  }

  const handleClose = () => {
    setFileList([])
    setSelectedFile(null)
    setFileContent("")
    setEditorError(null)
    setEditorLoading(false)
    setFileContentLoading(false)
    setEditingName("")
    setEditingDescription("")
    setResourceInfoChanged(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-7xl w-[90vw] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            {t("resources.editor.title", { 
              type: t(`resources.types.${editingItem?.type}`), 
              name: editingItem?.name 
            })}
          </DialogTitle>
        </DialogHeader>

        {/* 资源信息编辑区域 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("resources.editor.fields.name")}</label>
              <Input
                value={editingName}
                onChange={e => {
                  setEditingName(e.target.value)
                  setResourceInfoChanged(true)
                }}
                placeholder={t("resources.editor.fields.namePlaceholder")}
                className="w-full"
                disabled={editorLoading || (editingItem?.source ?? "user") !== "user"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("resources.editor.fields.description")}</label>
              <Input
                value={editingDescription}
                onChange={e => {
                  setEditingDescription(e.target.value)
                  setResourceInfoChanged(true)
                }}
                placeholder={t("resources.editor.fields.descriptionPlaceholder")}
                className="w-full"
                disabled={editorLoading || (editingItem?.source ?? "user") !== "user"}
              />
            </div>
          </div>
          {resourceInfoChanged && (
            <div className="mt-3 flex justify-end">
              <Button 
                onClick={handleSaveResourceInfo} 
                disabled={editorLoading || !editingName.trim()} 
                className="text-sm text-white"
              >
                {editorLoading ? t("resources.editor.buttons.saving") : t("resources.editor.buttons.saveResourceInfo")}
              </Button>
            </div>
          )}
        </div>

        {/* 弹窗内容 */}
        <div className="flex border-b flex-1 overflow-hidden">
          {/* 左侧文件列表 */}
          <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
            <h3 className="font-medium mb-3">{t("resources.editor.fileList")}</h3>
            {editorLoading && <p className="text-sm text-gray-500">{t("resources.editor.messages.loading")}</p>}
            {editorError && <p className="text-sm text-red-600">{editorError}</p>}
            <div className="space-y-1">
              {fileList.map(file => {
                const isJs = file.endsWith(".js")
                const isMd = file.endsWith(".md")
                const isSelected = selectedFile === file

                return (
                  <Button 
                    key={file} 
                    variant="ghost"
                    onClick={() => handleSelectFile(file)} 
                    className={`w-full justify-start text-left p-2 h-auto text-sm transition-colors ${
                      isSelected 
                        ? "bg-blue-100 text-blue-900 hover:bg-blue-200 hover:text-blue-900" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center w-full min-w-0">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${
                        isJs ? "bg-yellow-500" : isMd ? "bg-blue-500" : "bg-gray-400"
                      }`} />
                      <span className="truncate" title={file}>
                        {file}
                      </span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* 右侧编辑器 */}
          <div className="flex-1 flex flex-col">
            {/* 编辑器头部 */}
            <div className="p-3 border-b bg-white flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedFile ? t("resources.editor.editFile", { file: selectedFile }) : t("resources.editor.selectFile")}
              </span>
              {selectedFile && (
                <Button 
                  onClick={handleSaveFile} 
                  disabled={editorLoading || (editingItem?.source ?? "user") !== "user"} 
                  size="sm"
                  className="text-white"
                >
                  {editorLoading ? t("resources.editor.buttons.saving") : t("resources.editor.buttons.saveFile")}
                </Button>
              )}
            </div>

            {/* 编辑器内容 */}
            <div className="flex-1 p-4 overflow-hidden">
              {fileContentLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">{t("resources.editor.messages.loadingFileContent")}</p>
                </div>
              ) : selectedFile ? (
                <textarea
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  className="w-full h-full resize-none border rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("resources.editor.fileContent")}
                  disabled={(editingItem?.source ?? "user") !== "user"}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">{t("resources.editor.selectFilePrompt")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {(editingItem?.source ?? "user") !== "user" && (
              <span className="text-orange-600">
                {t("resources.editor.readOnly", { source: editingItem?.source })}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={handleClose}>
            {t("resources.editor.buttons.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}