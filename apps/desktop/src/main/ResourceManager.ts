import { ResourceListWindow } from '~/main/windows/ResourceListWindow'
import { ResourceService } from '~/main/application/ResourceService'
import { PromptXResourceRepository } from '~/main/infrastructure/PromptXResourceRepository'
import { PromptXActivationAdapter } from '~/main/infrastructure/PromptXActivationAdapter'

/**
 * Resource Manager - 主程序集成点
 * 负责组装和管理资源（角色和工具）相关组件
 */
export class ResourceManager {
  private resourceListWindow: ResourceListWindow | null = null
  private resourceService: ResourceService

  constructor() {
    // 依赖注入，组装各层组件
    const repository = new PromptXResourceRepository()
    const activationAdapter = new PromptXActivationAdapter()
    this.resourceService = new ResourceService(repository, activationAdapter)
    
    // 创建窗口管理器
    this.resourceListWindow = new ResourceListWindow(this.resourceService)
  }

  showResourceList(): void {
    this.resourceListWindow?.show()
  }

  hideResourceList(): void {
    this.resourceListWindow?.hide()
  }

  destroy(): void {
    this.resourceListWindow?.close()
    this.resourceListWindow = null
  }
}