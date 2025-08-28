import { Resource, ResourceRepository, ResourceType, ResourceSource, GroupedResources, ResourceStatistics } from '~/main/domain/Resource'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * PromptX Resource Repository - 基础设施层实现
 * 直接使用 WelcomeCommand 获取完整的资源数据
 */
export class PromptXResourceRepository implements ResourceRepository {
  private resourcesCache: Resource[] | null = null
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 5000 // 5秒缓存
  private welcomeCommand: any = null

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

  private getWelcomeCommand() {
    if (!this.welcomeCommand) {
      // 动态导入 WelcomeCommand
      const WelcomeCommand = require('@promptx/cli/src/lib/core/pouch/commands/WelcomeCommand')
      this.welcomeCommand = new WelcomeCommand()
    }
    return this.welcomeCommand
  }

  private async fetchResourcesFromPromptX(): Promise<Resource[]> {
    try {
      const welcomeCommand = this.getWelcomeCommand()
      
      // 刷新所有资源
      await welcomeCommand.refreshAllResources()
      
      // 加载角色和工具注册表
      const roleRegistry = await welcomeCommand.loadRoleRegistry()
      const toolRegistry = await welcomeCommand.loadToolRegistry()
      
      // 按来源分组
      const roleCategories = welcomeCommand.categorizeBySource(roleRegistry)
      const toolCategories = welcomeCommand.categorizeBySource(toolRegistry)
      
      console.log('roleCategories structure:', Object.keys(roleCategories), 
        'system:', Array.isArray(roleCategories.system), 
        'project:', Array.isArray(roleCategories.project),
        'user:', Array.isArray(roleCategories.user))
      
      // 转换为统一的 Resource 格式
      const resources: Resource[] = []
      
      // 处理角色
      this.processRoles(roleCategories, resources)
      
      // 处理工具
      this.processTools(toolCategories, resources)
      
      console.log(`Loaded ${resources.length} resources from PromptX (roles: ${roleCategories.system?.length + roleCategories.project?.length + roleCategories.user?.length || 0}, tools: ${toolCategories.system?.length + toolCategories.project?.length + toolCategories.user?.length || 0})`)
      
      return resources
      
    } catch (error) {
      console.error('Failed to fetch resources from PromptX:', error)
      return [] // 返回空数组而不是 mock 数据
    }
  }

  private processRoles(categories: any, resources: Resource[]) {
    // 处理系统角色
    if (categories.system) {
      categories.system.forEach((role: any) => {
        resources.push(this.convertToResource(role, 'role', 'system'))
      })
    }
    
    // 处理项目角色
    if (categories.project) {
      categories.project.forEach((role: any) => {
        resources.push(this.convertToResource(role, 'role', 'project'))
      })
    }
    
    // 处理用户角色
    if (categories.user) {
      categories.user.forEach((role: any) => {
        resources.push(this.convertToResource(role, 'role', 'user'))
      })
    }
  }

  private processTools(categories: any, resources: Resource[]) {
    // 处理系统工具
    if (categories.system) {
      categories.system.forEach((tool: any) => {
        resources.push(this.convertToResource(tool, 'tool', 'system'))
      })
    }
    
    // 处理项目工具
    if (categories.project) {
      categories.project.forEach((tool: any) => {
        resources.push(this.convertToResource(tool, 'tool', 'project'))
      })
    }
    
    // 处理用户工具
    if (categories.user) {
      categories.user.forEach((tool: any) => {
        resources.push(this.convertToResource(tool, 'tool', 'user'))
      })
    }
  }

  private convertToResource(promptxResource: any, type: ResourceType, source: ResourceSource): Resource {
    const resource: Resource = {
      id: promptxResource.id || promptxResource.resourceId || 'unknown',
      name: promptxResource.name || promptxResource.title || promptxResource.id || 'Unknown',
      description: promptxResource.description || promptxResource.brief || '暂无描述',
      type,
      source,
      category: promptxResource.category || 'general',
      tags: promptxResource.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
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
}