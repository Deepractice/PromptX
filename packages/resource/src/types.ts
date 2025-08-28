/**
 * 资源类型定义
 */

export interface Resource {
  /** 资源唯一标识 */
  id: string
  /** 资源文件路径（相对于包根目录） */
  path: string
  /** 资源标题 */
  title: string
  /** 资源描述 */
  description: string
  /** 文件类型 (md, json) */
  type: string
  /** 文件大小 */
  size: number
  /** 最后修改时间 */
  modified: string
  /** 资源分类 (role, tool, protocol) */
  category: string
}

export interface ResourceRegistry {
  /** 注册表版本 */
  version: string
  /** 生成时间 */
  generated: string
  /** 资源总数 */
  total: number
  /** 按分类组织的资源 */
  resources: {
    role: Resource[]
    tool: Resource[]
    protocol: Resource[]
  }
}

export interface ResourcePackage {
  /** 注册表数据 */
  registry: ResourceRegistry
  /** 获取资源的绝对路径 */
  getResourcePath(relativePath: string): string
  /** 根据 ID 查找资源 */
  findResourceById(id: string): Resource | undefined
  /** 根据分类获取资源列表 */
  getResourcesByCategory(category: 'role' | 'tool' | 'protocol'): Resource[]
  /** 获取所有资源列表 */
  getAllResources(): Resource[]
}