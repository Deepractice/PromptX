import { GroupedResources, Resource, ResourceRepository, ResourceSource, ResourceStatistics, ResourceType } from '~/main/domain/Resource'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * PromptX Resource Repository - 基础设施层实现
 * 直接使用 DiscoverCommand 获取完整的资源数据
 */
export class PromptXResourceRepository implements ResourceRepository {
  private resourcesCache: Resource[] | null = null
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 5000 // 5秒缓存
  private discoverCommand: any = null

  async findAll(): Promise<Resource[]> {
    return this.getResourcesWithCache()
  }

  async findById(id: string): Promise<Resource | null> {
    const resources = await this.getResourcesWithCache()
    return resources.find(r => r.id === id) || null
  }

  async findByType(type: ResourceType): Promise<Resource[]> {
    const resources = await this.getResourcesWithCache()
    return resources.filter(r => r.type === type)
  }

  async findBySource(source: ResourceSource): Promise<Resource[]> {
    const resources = await this.getResourcesWithCache()
    return resources.filter(r => r.source === source)
  }

  async search(query: string): Promise<Resource[]> {
    const resources = await this.getResourcesWithCache()
    const lowerQuery = query.toLowerCase()
    
    return resources.filter(resource => 
      resource.name.toLowerCase().includes(lowerQuery) ||
      resource.description.toLowerCase().includes(lowerQuery) ||
      resource.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  async getGroupedBySource(): Promise<GroupedResources> {
    const resources = await this.getResourcesWithCache()
    
    const grouped: GroupedResources = {
      system: { roles: [], tools: [] },
      project: { roles: [], tools: [] },
      user: { roles: [], tools: [] }
    }

    resources.forEach(resource => {
      const sourceGroup = grouped[resource.source]
      if (resource.type === 'role') {
        sourceGroup.roles.push(resource)
      } else {
        sourceGroup.tools.push(resource)
      }
    })

    return grouped
  }

  async getStatistics(): Promise<ResourceStatistics> {
    const grouped = await this.getGroupedBySource()
    
    return {
      totalRoles: grouped.system.roles.length + grouped.project.roles.length + grouped.user.roles.length,
      totalTools: grouped.system.tools.length + grouped.project.tools.length + grouped.user.tools.length,
      systemRoles: grouped.system.roles.length,
      systemTools: grouped.system.tools.length,
      projectRoles: grouped.project.roles.length,
      projectTools: grouped.project.tools.length,
      userRoles: grouped.user.roles.length,
      userTools: grouped.user.tools.length
    }
  }

  private async getResourcesWithCache(): Promise<Resource[]> {
    const now = Date.now()
    
    if (this.resourcesCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.resourcesCache
    }

    this.resourcesCache = await this.fetchResourcesFromPromptX()
    this.cacheTimestamp = now
    
    return this.resourcesCache
  }

  private getDiscoverCommand() {
    if (!this.discoverCommand) {
      // 动态导入 DiscoverCommand from core package
      const core = require('@promptx/core')
      const { DiscoverCommand } = core.pouch.commands
      this.discoverCommand = new DiscoverCommand()
    }
    return this.discoverCommand
  }

  private async fetchResourcesFromPromptX(): Promise<Resource[]> {
    try {
      const discoverCommand = this.getDiscoverCommand()
      
      // 刷新所有资源
      await discoverCommand.refreshAllResources()
      
      // 加载角色和工具注册表 - 这里已经只获取 role 和 tool 类型
      const roleRegistry = await discoverCommand.loadRoleRegistry()
      const toolRegistry = await discoverCommand.loadToolRegistry()
      
      // 按来源分组
      const roleCategories = discoverCommand.categorizeBySource(roleRegistry)
      const toolCategories = discoverCommand.categorizeBySource(toolRegistry)
      
      console.log('roleCategories structure:', Object.keys(roleCategories), 
        'system:', Array.isArray(roleCategories.system), 
        'project:', Array.isArray(roleCategories.project),
        'user:', Array.isArray(roleCategories.user))
      
      // 转换为统一的 Resource 格式
      const resources: Resource[] = []
      
      // 处理角色
      await this.processRoles(roleCategories, resources)
      
      // 处理工具
      await this.processTools(toolCategories, resources)
      
      console.log(`Loaded ${resources.length} resources from PromptX (roles: ${roleCategories.system?.length + roleCategories.project?.length + roleCategories.user?.length || 0}, tools: ${toolCategories.system?.length + toolCategories.project?.length + toolCategories.user?.length || 0})`)
      
      return resources
      
    } catch (error) {
      console.error('Failed to fetch resources from PromptX:', error)
      return [] // 返回空数组而不是 mock 数据
    }
  }

  private async processRoles(categories: any, resources: Resource[]) {
    // 处理系统角色
    if (categories.system) {
      for (const role of categories.system) {
        const resource = await this.convertToResource(role, 'role', 'system')
        resources.push(resource)
      }
    }
    
    // 处理项目角色
    if (categories.project) {
      for (const role of categories.project) {
        const resource = await this.convertToResource(role, 'role', 'project')
        resources.push(resource)
      }
    }
    
    // 处理用户角色
    if (categories.user) {
      for (const role of categories.user) {
        const resource = await this.convertToResource(role, 'role', 'user')
        resources.push(resource)
      }
    }
  }

  private async processTools(categories: any, resources: Resource[]) {
    // 处理系统工具
    if (categories.system) {
      for (const tool of categories.system) {
        const resource = await this.convertToResource(tool, 'tool', 'system')
        resources.push(resource)
      }
    }
    
    // 处理项目工具
    if (categories.project) {
      for (const tool of categories.project) {
        const resource = await this.convertToResource(tool, 'tool', 'project')
        resources.push(resource)
      }
    }
    
    // 处理用户工具
    if (categories.user) {
      for (const tool of categories.user) {
        const resource = await this.convertToResource(tool, 'tool', 'user')
        resources.push(resource)
      }
    }
  }

  private async convertToResource(promptxResource: any, type: ResourceType, source: ResourceSource): Promise<Resource> {
    const resourceId = promptxResource.id || promptxResource.resourceId || 'unknown'
    
    // 对于用户资源，尝试读取自定义元数据
    let customMetadata: any = {}
    if (source === 'user') {
      try {
        const path = require('path')
        const fs = require('fs-extra')
        const os = require('os')
        
        const resourceDir = path.join(os.homedir(), '.promptx', 'resource', type, resourceId)
        const metadataFile = path.join(resourceDir, 'metadata.json')
        
        if (await fs.pathExists(metadataFile)) {
          customMetadata = await fs.readJson(metadataFile)
        }
      } catch (error) {
        // 如果读取失败，使用默认值
        console.warn(`Failed to read custom metadata for ${resourceId}:`, error)
      }
    }
    
    const resource: Resource = {
      id: resourceId,
      name: customMetadata.name || promptxResource.name || promptxResource.title || resourceId || 'Unknown',
      description: customMetadata.description || promptxResource.description || promptxResource.brief || '暂无描述',
      type,
      source,
      category: promptxResource.category || 'general',
      tags: promptxResource.tags || [],
      createdAt: new Date(),
      updatedAt: customMetadata.updatedAt ? new Date(customMetadata.updatedAt) : new Date()
    }

    // 添加角色特有字段
    if (type === 'role' && promptxResource.personality) {
      resource.personality = promptxResource.personality
    }

    // 添加工具特有字段
    if (type === 'tool') {
      if (promptxResource.manual) {
        resource.manual = promptxResource.manual
      }
      if (promptxResource.parameters) {
        resource.parameters = promptxResource.parameters
      }
    }

    return resource
  }

  async updateMetadata(id: string, updates: { name?: string; description?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      // 只支持更新用户资源
      const resource = await this.findById(id)
      if (!resource) {
        return { success: false, message: '资源不存在' }
      }

      if (resource.source !== 'user') {
        return { success: false, message: '仅支持修改用户资源的元数据' }
      }

      // 获取资源的实际存储路径
      const path = require('path')
      const fs = require('fs-extra')
      const os = require('os')

      const resourceDir = path.join(os.homedir(), '.promptx', 'resource', resource.type, id)
      const metadataFile = path.join(resourceDir, 'metadata.json')

      // 检查资源目录是否存在
      const exists = await fs.pathExists(resourceDir)
      if (!exists) {
        return { success: false, message: '资源目录不存在' }
      }

      // 读取现有元数据或创建新的
      let metadata: any = {}
      if (await fs.pathExists(metadataFile)) {
        try {
          metadata = await fs.readJson(metadataFile)
        } catch (e) {
          // 如果读取失败，使用空对象
          metadata = {}
        }
      }

      // 更新元数据
      if (updates.name !== undefined) {
        metadata.name = updates.name
      }
      if (updates.description !== undefined) {
        metadata.description = updates.description
      }
      metadata.updatedAt = new Date().toISOString()

      // 保存元数据
      await fs.writeJson(metadataFile, metadata, { spaces: 2 })

      // 清除缓存，强制下次重新加载
      this.resourcesCache = null

      return { success: true, message: '元数据更新成功' }
    } catch (error: any) {
      console.error('Failed to update resource metadata:', error)
      return { success: false, message: error.message || '更新元数据失败' }
    }
  }
}