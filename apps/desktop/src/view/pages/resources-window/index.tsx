import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Pickaxe, UserRoundPen, Database, SquarePen, FolderDown, Trash } from "lucide-react"
import { toast, Toaster } from "sonner"

type ResourceItem = {
  id: string
  name: string
  description?: string
  type: "role" | "tool"
  source?: string
}

type Statistics = {
  roles: number
  tools: number
  sources?: Record<string, number>
}

export default function ResourcesPage() {
  const [items, setItems] = useState<ResourceItem[]>([])
  const [stats, setStats] = useState<Statistics | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 新增：筛选状态
  const [typeFilter, setTypeFilter] = useState<"all" | "role" | "tool">("all")
  const [sourceFilter, setSourceFilter] = useState<"all" | "system" | "user">("all")

  // 新增：根据筛选与搜索计算结果
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      const typeOk = typeFilter === "all" || item.type === typeFilter
      const src = item.source ?? "user"
      const sourceOk = sourceFilter === "all" || src === sourceFilter
      const queryOk = q === "" || item.name.toLowerCase().includes(q)
      return typeOk && sourceOk && queryOk
    })
  }, [items, typeFilter, sourceFilter, query])
  const loadResources = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI?.getGroupedResources()
      if (result?.success) {
        const { grouped, statistics } = result.data || {}
        const flat: ResourceItem[] = []
        Object.keys(grouped || {}).forEach(source => {
          const group = grouped[source] || {}
          ;(group.roles || []).forEach((role: any) => flat.push({ id: role.id || role.name, name: role.name, description: role.description, type: "role", source }))
          ;(group.tools || []).forEach((tool: any) => flat.push({ id: tool.id || tool.name, name: tool.name, description: tool.description, type: "tool", source }))
        })
        setItems(flat)
        console.log("Loaded resources:", flat)
        console.log("Loaded statistics:", statistics)

        // 使用统一的计算函数
        setStats(calculateStats(flat))
      } else {
        setError("加载资源失败")
      }
    } catch (e: any) {
      console.error("Failed to load resources:", e)
      setError(e?.message || "加载资源失败")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      // 清空搜索回到初始列表
      loadResources()
      return
    }
    try {
      setLoading(true)
      const result = await window.electronAPI?.searchResources(q.trim())
      if (result?.success) {
        const list: ResourceItem[] = (result.data || []).map((item: any) => ({
          id: item.id || item.name,
          name: item.name,
          description: item.description,
          source: item.source,
          type: item.type
        }))
        setItems(list)
      } else {
        setError("搜索失败")
      }
    } catch (e: any) {
      console.error("Search failed:", e)
      setError(e?.message || "搜索失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
    // 可选：独立统计接口
    // window.electronAPI?.getStatistics().then(setStats).catch(() => {})
  }, [])

  const roleCount = useMemo(() => items.filter(i => i.type === "role").length, [items])
  const toolCount = useMemo(() => items.filter(i => i.type === "tool").length, [items])

  // 动态计算来源统计信息
  const sourceStats = useMemo(() => {
    const stats: Record<string, number> = {}
    items.forEach(item => {
      const source = item.source || "user"
      stats[source] = (stats[source] || 0) + 1
    })
    return stats
  }, [items])

  // 统一的统计信息计算函数
  const calculateStats = (itemList: ResourceItem[]): Statistics => {
    const roles = itemList.filter(item => item.type === "role").length
    const tools = itemList.filter(item => item.type === "tool").length

    const sources: Record<string, number> = {}
    itemList.forEach(item => {
      const source = item.source || "user"
      sources[source] = (sources[source] || 0) + 1
    })

    return { roles, tools, sources }
  }

  // 分享即下载（绑定到“查看/外链”图标）
  const handleView = async (item: ResourceItem) => {
    try {
      const res = await window.electronAPI?.invoke("resources:download", {
        id: item.id,
        type: item.type,
        source: item.source ?? "user"
      })
      if (res?.success) {
        toast.success(`已保存到：${res.path}`)
      } else {
        toast.error(res?.message || "下载失败")
      }
    } catch (err) {
      toast.error(`下载失败：${String(err)}`)
    }
  }
  // 删除处理
  const handleDelete = async (item: ResourceItem) => {
    if ((item.source ?? "user") !== "user") {
      toast.error("仅支持删除用户资源（system/project不可删除）")
      return
    }
    const ok = window.confirm(`确认删除${item.type === "role" ? "角色" : "工具"} "${item.name}"？此操作不可恢复。`)
    if (!ok) return

    try {
      const res = await window.electronAPI?.invoke("resources:delete", {
        id: item.id,
        type: item.type,
        source: item.source ?? "user"
      })
      if (res?.success) {
        // 更新本地列表
        const updatedItems = items.filter(i => !(i.id === item.id && i.type === item.type))
        setItems(updatedItems)

        // 重新计算统计信息
        setStats(calculateStats(updatedItems))

        toast.success("删除成功")
      } else {
        toast.error(res?.message || "删除失败")
      }
    } catch (err) {
      toast.error(`删除失败：${String(err)}`)
    }
  }

  // 新增：编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [fileList, setFileList] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null)
  const [fileContentLoading, setFileContentLoading] = useState(false)

  // 新增：资源信息编辑状态
  const [editingName, setEditingName] = useState<string>("")
  const [editingDescription, setEditingDescription] = useState<string>("")
  const [resourceInfoChanged, setResourceInfoChanged] = useState(false)

  // 新增：编辑（弹窗）
  const handleEdit = async (item: ResourceItem) => {
    setEditorOpen(true)
    setEditingItem(item)
    setEditorLoading(true)
    setEditorError(null)

    // 初始化资源信息编辑状态
    setEditingName(item.name || "")
    setEditingDescription(item.description || "")
    setResourceInfoChanged(false)

    try {
      const res = await window.electronAPI?.invoke("resources:listFiles", {
        id: item.id,
        type: item.type,
        source: item.source ?? "user"
      })
      if (!res?.success) throw new Error(res?.message || "加载文件列表失败")
      const files: string[] = res.files || []
      setFileList(files)
      const initial = files[0] || null
      setSelectedFile(initial)
      if (initial) {
        const fr = await window.electronAPI?.invoke("resources:readFile", {
          id: item.id,
          type: item.type,
          source: item.source ?? "user",
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

  // 新增：选择文件
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
      if (!fr?.success) throw new Error(fr?.message || "读取文件失败")
      setFileContent(fr.content || "")
    } catch (e: any) {
      setEditorError(e?.message || "读取文件失败")
      setFileContent("") // 出错时清空内容
    } finally {
      setFileContentLoading(false)
    }
  }

  // 新增：保存文件
  const handleSaveFile = async () => {
    if (!editingItem || !selectedFile) return
    if ((editingItem.source ?? "user") !== "user") {
      toast.error("仅支持修改用户资源（system/project不可编辑）")
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
      if (!sr?.success) throw new Error(sr?.message || "保存失败")
      toast.success("保存成功")
    } catch (e: any) {
      setEditorError(e?.message || "保存失败")
    } finally {
      setEditorLoading(false)
    }
  }

  // 新增：保存资源信息（名称和描述）
  const handleSaveResourceInfo = async () => {
    if (!editingItem) return
    if ((editingItem.source ?? "user") !== "user") {
      toast.error("仅支持修改用户资源（system/project不可编辑）")
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
      if (!sr?.success) throw new Error(sr?.message || "保存失败")

      // 更新本地状态
      setEditingItem(prev => (prev ? { ...prev, name: editingName, description: editingDescription } : null))
      setResourceInfoChanged(false)

      // 刷新资源列表
      await loadResources()

      toast.success("资源信息保存成功")
    } catch (e: any) {
      setEditorError(e?.message || "保存资源信息失败")
    } finally {
      setEditorLoading(false)
    }
  }

  // 新增：关闭编辑器
  const closeEditor = () => {
    setEditorOpen(false)
    setEditingItem(null)
    setFileList([])
    setSelectedFile(null)
    setFileContent("")
    setEditorError(null)
    setEditorLoading(false)
    setFileContentLoading(false)

    // 清理资源信息编辑状态
    setEditingName("")
    setEditingDescription("")
    setResourceInfoChanged(false)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input placeholder="搜索资源 / 角色 / 工具" value={query} onChange={e => handleSearch(e.target.value)} className="max-w-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundPen className="h-4 w-4" />
              角色
            </CardTitle>
            <CardDescription>可激活的角色数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pickaxe className="h-4 w-4" />
              工具
            </CardTitle>
            <CardDescription>可执行的工具数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-[#e5e7eb]  hover:scale-[1.01] transition-colors duration-200 cursor-pointer">
          <CardHeader className="pb-1 ">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              来源
            </CardTitle>
            <CardDescription>各来源资源计数</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-lg  font-bold text-muted-foreground">
              {Object.entries(sourceStats).map(([src, count]) => (
                <li key={src} className="flex justify-between">
                  <span>{src}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* 筛选栏放在网格上方 */}
      <div className="flex items-center gap-4 mb-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "all" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("all")}>
            All
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "role" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("role")}>
            Roles
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${typeFilter === "tool" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setTypeFilter("tool")}>
            Tools
          </button>
        </div>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-muted" />

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Source:</span>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "all" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("all")}>
            All
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "system" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("system")}>
            System
          </button>
          <button className={`rounded-md border px-3 py-1 text-sm transition-colors ${sourceFilter === "user" ? "bg-[#eef6ff] text-[#1f6feb] border-[#cfe4ff]" : "bg-background text-foreground hover:bg-muted"}`} onClick={() => setSourceFilter("user")}>
            User
          </button>
        </div>
      </div>

      {/* 原来的网格容器保持不变，只把 items.map 改为 filteredItems.map */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map(item => (
          <Card key={`${item.type}-${item.id}`} onClick={() => handleEdit(item)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
            <CardHeader className="p-4 ">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {item.type === "role" ? <UserRoundPen className="h-6 w-6" /> : <Pickaxe className="h-6 w-6" />}
                  {item.name}
                </span>
                <span className="flex items-center gap-3">
                  {/* 编辑 */}
                  <SquarePen className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-[#1f6feb]" onClick={() => handleEdit(item)} />
                  {/* 查看/外链 */}
                  <FolderDown className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-[#1f6feb]" onClick={() => handleView(item)} />
                  {/* 删除 */}
                  {item.source === "user" && <Trash className="h-5 w-5 cursor-pointer transition-transform duration-200 hover:scale-[1.1] hover:text-red-600" onClick={() => handleDelete(item)} />}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 mb-0">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              <div className="flex gap-4">
                <div className={`inline-flex items-center rounded-2xl px-2 py-1 text-sm ${item.type === "role" ? "bg-[#DDF4FF] text-[#1f6feb]" : "bg-[#FBEFFF] text-[#B472DF]"}`}>{item.type}</div>
                <div className={`inline-flex items-center rounded-2xl px-2 py-1 text-sm ${(item.source ?? "user") === "system" ? "bg-[#a8dafc] text-[#1063e0]" : "bg-[#D3F3DA] text-[#56A69C]"}`}>{item.source ?? "user"}</div>
                <span className="text-sm inline-flex items-center px-2 py-1 text-[#666]">ID: {item.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center py-4">
        <span className="text-sm text-muted-foreground">没有更多了:-I</span>
      </div>
      {/* 编辑器弹窗 */}
      <Dialog
        open={editorOpen}
        onOpenChange={open => {
          if (!open) {
            closeEditor()
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[90vw] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              编辑 {editingItem?.type === "role" ? "角色" : "工具"}: {editingItem?.name}
            </DialogTitle>
          </DialogHeader>

          {/* 资源信息编辑区域 */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <Input
                  value={editingName}
                  onChange={e => {
                    setEditingName(e.target.value)
                    setResourceInfoChanged(true)
                  }}
                  placeholder="输入资源名称"
                  className="w-full"
                  disabled={editorLoading || (editingItem?.source ?? "user") !== "user"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <Input
                  value={editingDescription}
                  onChange={e => {
                    setEditingDescription(e.target.value)
                    setResourceInfoChanged(true)
                  }}
                  placeholder="输入资源描述"
                  className="w-full"
                  disabled={editorLoading || (editingItem?.source ?? "user") !== "user"}
                />
              </div>
            </div>
            {resourceInfoChanged && (
              <div className="mt-3 flex justify-end">
                <Button onClick={handleSaveResourceInfo} disabled={editorLoading || !editingName.trim()} className="text-sm  text-white">
                  {editorLoading ? "保存中..." : "保存资源信息"}
                </Button>
              </div>
            )}
          </div>

          {/* 弹窗内容 */}
          <div className="flex border-b flex-1 overflow-hidden">
            {/* 左侧文件列表 */}
            <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-medium mb-3">文件列表</h3>
              {editorLoading && <p className="text-sm text-gray-500">加载中...</p>}
              {editorError && <p className="text-sm text-red-600">{editorError}</p>}
              <div className="space-y-1">
                {fileList.map(file => {
                  const isJs = file.endsWith(".js")
                  const isMd = file.endsWith(".md")
                  const isSelected = selectedFile === file

                  return (
                    <Button key={file} variant={isSelected ? "default" : "ghost"} onClick={() => handleSelectFile(file)} className={`w-full justify-start text-left  p-2 h-auto text-sm transition-colors flex items-center gap-2 ${isSelected ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "hover:bg-gray-200"}`}>
                      <span className="text-xs">{isJs ? "🔧" : isMd ? "📝" : "📄"}</span>
                      <span className="truncate">{file}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* 右侧内容编辑器 */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{selectedFile ? `编辑: ${selectedFile}` : "请选择文件"}</span>
                  <Button className="text-white" onClick={handleSaveFile} disabled={!selectedFile || editorLoading || fileContentLoading || (editingItem?.source ?? "user") !== "user"}>
                    保存
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-4">
                {selectedFile ? (
                  fileContentLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p>正在加载文件内容...</p>
                      </div>
                    </div>
                  ) : (
                    <textarea value={fileContent} onChange={e => setFileContent(e.target.value)} className={`w-full h-full border rounded p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${(editingItem?.source ?? "user") !== "user" ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-white"}`} placeholder={(editingItem?.source ?? "user") !== "user" ? "此资源为只读，无法编辑..." : selectedFile.endsWith(".js") ? "JavaScript工具文件内容..." : selectedFile.endsWith(".md") ? "Markdown文档内容..." : "文件内容..."} readOnly={(editingItem?.source ?? "user") !== "user"} />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p>请从左侧选择要编辑的文件</p>
                      {editingItem?.type === "tool" && <p className="text-xs mt-2 text-gray-400">工具通常包含 .tool.js 文件和 README.md 文档</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}
