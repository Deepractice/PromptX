import { GroupedResources, Resource, ResourceRepository, ResourceSource, ResourceStatistics, ResourceType } from '~/main/domain/Resource'

/**
 * Resource Service - 应用层服务
 * 负责资源的业务逻辑
 */
export class ResourceService {
  constructor(
    private repository: ResourceRepository,
    private activationAdapter: any
  ) {}

  /**
   * 获取所有资源
   */
  async getAllResources(): Promise<Resource[]> {
    return this.repository.findAll()
  }

  /**
   * 按类型获取资源
   */
  async getResourcesByType(type: ResourceType): Promise<Resource[]> {
    return this.repository.findByType(type)
  }

  /**
   * 按来源获取资源
   */
  async getResourcesBySource(source: ResourceSource): Promise<Resource[]> {
    return this.repository.findBySource(source)
  }

  /**
   * 获取分组资源（用于UI展示）
   */
  async getGroupedResources(): Promise<GroupedResources> {
    return this.repository.getGroupedBySource()
  }

  /**
   * 获取资源统计
   */
  async getStatistics(): Promise<ResourceStatistics> {
    return this.repository.getStatistics()
  }

  /**
   * 搜索资源
   */
  async searchResources(query: string): Promise<Resource[]> {
    return this.repository.search(query)
  }

  /**
   * 激活角色
   */
  async activateRole(roleId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const resource = await this.repository.findById(roleId)
      
      if (!resource) {
        return { success: false, message: '角色不存在' }
      }

      if (resource.type !== 'role') {
        return { success: false, message: '只能激活角色类型的资源' }
      }

      const result = await this.activationAdapter.activate(roleId)
      return result
    } catch (error: any) {
      return { success: false, message: error.message || '激活失败' }
    }
  }


  /**
   * 更新资源元数据（名称和描述）
   */
  async updateResourceMetadata(id: string, updates: { name?: string; description?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const resource = await this.repository.findById(id)
      
      if (!resource) {
        return { success: false, message: '资源不存在' }
      }

      if (resource.source !== 'user') {
        return { success: false, message: '仅支持修改用户资源的元数据' }
      }

      return await this.repository.updateMetadata(id, updates)
    } catch (error: any) {
      return { success: false, message: error.message || '更新失败' }
    }
  }
}