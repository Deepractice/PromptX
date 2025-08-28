/**
 * Role List Renderer - 前端渲染逻辑
 * TypeScript实现，类型安全
 */

interface Role {
  id: string
  name: string
  description: string
  source: 'system' | 'project' | 'user'
  category: string
  tags: string[]
}

interface ActivationResult {
  success: boolean
  roleId: string
  message: string
}

class RoleListRenderer {
  private activeRoleId: string | null = null
  private searchTimeout: number | null = null

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    await this.loadRoles()
    this.setupEventListeners()
  }

  private async loadRoles(): Promise<void> {
    try {
      const grouped = await window.electronAPI.getGroupedRoles()
      this.renderRoles(grouped)
    } catch (error) {
      this.renderError((error as Error).message)
    }
  }

  private setupEventListeners(): void {
    const searchBox = document.getElementById('searchBox') as HTMLInputElement
    
    searchBox?.addEventListener('input', (e) => {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.searchTimeout = window.setTimeout(() => {
        const target = e.target as HTMLInputElement
        this.handleSearch(target.value)
      }, 300)
    })
  }

  private async handleSearch(query: string): Promise<void> {
    if (!query.trim()) {
      await this.loadRoles()
      return
    }

    try {
      const roles = await window.electronAPI.searchRoles(query)
      this.renderSearchResults(roles)
    } catch (error) {
      this.renderError((error as Error).message)
    }
  }

  private renderRoles(grouped: Record<string, Role[]>): void {
    const content = document.getElementById('content')
    if (!content) return
    
    content.innerHTML = ''

    const sources: Array<'system' | 'project' | 'user'> = ['system', 'project', 'user']
    const sourceLabels: Record<string, string> = {
      system: 'System Roles',
      project: 'Project Roles', 
      user: 'User Roles'
    }

    sources.forEach(source => {
      const roles = grouped[source] || []
      if (roles.length === 0) return

      const label = sourceLabels[source] || source
      const groupDiv = this.createRoleGroup(label, roles)
      content.appendChild(groupDiv)
    })
  }

  private renderSearchResults(roles: Role[]): void {
    const content = document.getElementById('content')
    if (!content) return
    
    if (roles.length === 0) {
      content.innerHTML = '<div class="empty-state">No roles found</div>'
      return
    }

    const groupDiv = this.createRoleGroup('Search Results', roles)
    content.innerHTML = ''
    content.appendChild(groupDiv)
  }

  private createRoleGroup(title: string, roles: Role[]): HTMLDivElement {
    const groupDiv = document.createElement('div')
    groupDiv.className = 'role-group'

    const titleDiv = document.createElement('div')
    titleDiv.className = 'group-title'
    titleDiv.textContent = title
    groupDiv.appendChild(titleDiv)

    roles.forEach(role => {
      const card = this.createRoleCard(role)
      groupDiv.appendChild(card)
    })

    return groupDiv
  }

  private createRoleCard(role: Role): HTMLDivElement {
    const card = document.createElement('div')
    card.className = 'role-card'
    
    if (role.id === this.activeRoleId) {
      card.classList.add('active')
    }

    // Role信息
    const info = document.createElement('div')
    info.className = 'role-info'

    const name = document.createElement('div')
    name.className = 'role-name'
    name.textContent = role.name

    const description = document.createElement('div')
    description.className = 'role-description'
    description.textContent = role.description

    const tags = document.createElement('div')
    tags.className = 'role-tags'
    
    role.tags.slice(0, 3).forEach(tag => {
      const tagSpan = document.createElement('span')
      tagSpan.className = 'tag'
      tagSpan.textContent = tag
      tags.appendChild(tagSpan)
    })

    info.appendChild(name)
    info.appendChild(description)
    info.appendChild(tags)

    // 激活按钮
    const button = document.createElement('button')
    button.className = 'activate-btn'
    button.textContent = role.id === this.activeRoleId ? 'Active' : 'Activate'
    button.onclick = () => this.activateRole(role.id)

    card.appendChild(info)
    card.appendChild(button)

    return card
  }

  private async activateRole(roleId: string): Promise<void> {
    try {
      const result: ActivationResult = await window.electronAPI.activateRole(roleId)
      
      if (result.success) {
        this.activeRoleId = roleId
        await this.loadRoles()
        this.showNotification(`Activated ${roleId}`)
      } else {
        this.showNotification(result.message, 'error')
      }
    } catch (error) {
      this.showNotification((error as Error).message, 'error')
    }
  }

  private renderError(message: string): void {
    const content = document.getElementById('content')
    if (!content) return
    
    content.innerHTML = `<div class="empty-state">Error: ${message}</div>`
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    // TODO: 实现更好的通知系统
    console.log(`[${type}] ${message}`)
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new RoleListRenderer()
})