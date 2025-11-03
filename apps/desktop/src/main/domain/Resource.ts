/**
 * Resource 领域模型 - 统一的资源（角色和工具）表示
 */

export type ResourceType = 'role' | 'tool'
export type ResourceSource = 'system' | 'project' | 'user'

/**
 * Resource 实体 - 代表一个角色或工具
 */
export interface Resource {
  id: string
  name: string
  description: string
  type: ResourceType
  source: ResourceSource
  category?: string
  tags: string[]
  // 角色特有字段
  personality?: string
  // 工具特有字段
  manual?: string
  parameters?: any
  // 元数据
  createdAt: Date
  updatedAt: Date
}

/**
 * Resource 仓储接口 - 定义数据访问契约
 */
export interface ResourceRepository {
  // 基础查询
  findAll(): Promise<Resource[]>
  findById(id: string): Promise<Resource | null>
  findByType(type: ResourceType): Promise<Resource[]>
  findBySource(source: ResourceSource): Promise<Resource[]>
  
  // 高级查询
  search(query: string): Promise<Resource[]>
  getGroupedBySource(): Promise<GroupedResources>
  getStatistics(): Promise<ResourceStatistics>
  
  // 更新操作
  updateMetadata(id: string, updates: { name?: string; description?: string }): Promise<{ success: boolean; message?: string }>
}

/**
 * 按来源分组的资源
 */
export interface GroupedResources {
  system: {
    roles: Resource[]
    tools: Resource[]
  }
  project: {
    roles: Resource[]
    tools: Resource[]
  }
  user: {
    roles: Resource[]
    tools: Resource[]
  }
}

/**
 * 资源统计信息
 */
export interface ResourceStatistics {
  totalRoles: number
  totalTools: number
  systemRoles: number
  systemTools: number
  projectRoles: number
  projectTools: number
  userRoles: number
  userTools: number
}

/**
 * Resource 值对象 - 资源状态
 */
export enum ResourceStatus {
  AVAILABLE = 'available',
  LOADING = 'loading',
  ERROR = 'error',
  DISABLED = 'disabled'
}