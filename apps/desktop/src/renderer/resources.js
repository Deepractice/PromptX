/**
 * Resources Management UI
 * 资源管理界面逻辑
 */

// 使用全局的 logger（会在 resources.html 中先加载 logger.js）
const logger = window.rendererLogger || {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log,
  step: console.log,
  success: console.log
}

class ResourceManager {
  constructor() {
    this.allResources = null
    this.filteredResources = null
    this.currentFilter = 'all'
    this.searchQuery = ''
    this.statistics = null
    
    this.init()
  }
  
  async init() {
    // 加载资源
    await this.loadResources()
    
    // 设置事件监听
    this.setupEventListeners()
  }
  
  async loadResources() {
    try {
      logger.info('Starting to load resources...')
      
      // 获取分组资源和统计信息
      const result = await window.electronAPI.getGroupedResources()
      logger.debug('IPC result received:', result)
      
      if (result.success) {
        // 调试：检查 result.data 的实际结构
        logger.info('=== DEBUG: result.data structure ===')
        logger.info('result.data type:', typeof result.data)
        logger.info('result.data keys:', Object.keys(result.data || {}))
        logger.info('result.data:', JSON.stringify(result.data, null, 2))
        
        let { grouped, statistics } = result.data
        
        // 修复数据格式问题 - 如果 grouped 是数组，取第一个元素
        if (Array.isArray(grouped) && grouped.length > 0) {
          logger.warn('Grouped data is array, extracting first element')
          grouped = grouped[0]
        }
        if (Array.isArray(statistics) && statistics.length > 0) {
          logger.warn('Statistics is array, extracting first element')
          statistics = statistics[0]
        }
        
        logger.debug('After extraction - grouped:', grouped)
        logger.debug('After extraction - statistics:', statistics)
        
        // 保存统计信息
        this.statistics = statistics
        this.updateStatistics()
        
        // 将分组资源转换为平面列表
        logger.step('Converting grouped resources to flat list...')
        this.allResources = this.flattenResources(grouped)
        logger.success(`Loaded ${this.allResources.length} resources successfully`)
        this.filteredResources = [...this.allResources]
        
        // 渲染资源列表
        this.renderResources()
      } else {
        logger.error('Failed to load resources:', result.error || 'Unknown error')
        this.showError(`Failed to load resources: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      logger.error('Error loading resources:', error.message)
      logger.error('Stack trace:', error.stack)
      this.showError(`Error loading resources: ${error.message}`)
    }
  }
  
  flattenResources(grouped) {
    const resources = []
    
    // 处理每个来源的资源
    ['system', 'project', 'user'].forEach(source => {
      const sourceGroup = grouped[source]
      if (sourceGroup) {
        // 添加角色
        if (sourceGroup.roles) {
          sourceGroup.roles.forEach(role => {
            resources.push({
              ...role,
              type: 'role',
              source
            })
          })
        }
        
        // 添加工具
        if (sourceGroup.tools) {
          sourceGroup.tools.forEach(tool => {
            resources.push({
              ...tool,
              type: 'tool',
              source
            })
          })
        }
      }
    })
    
    return resources
  }
  
  updateStatistics() {
    if (!this.statistics) return
    
    const stats = this.statistics
    const statsContainer = document.getElementById('stats')
    
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.totalRoles + stats.totalTools}</div>
        <div class="stat-label">Total Resources</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalRoles}</div>
        <div class="stat-label">Roles</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalTools}</div>
        <div class="stat-label">Tools</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.userRoles + stats.userTools}</div>
        <div class="stat-label">User Custom</div>
      </div>
    `
  }
  
  renderResources() {
    const container = document.getElementById('resourceContainer')
    
    if (!this.filteredResources || this.filteredResources.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div>No resources found</div>
        </div>
      `
      return
    }
    
    // 按来源分组显示
    const grouped = this.groupBySource(this.filteredResources)
    let html = ''
    
    // 渲染每个来源的资源
    const sourceOrder = ['system', 'project', 'user']
    const sourceLabels = {
      system: 'System Resources',
      project: 'Project Resources',
      user: 'User Resources'
    }
    
    sourceOrder.forEach(source => {
      const resources = grouped[source]
      if (!resources || resources.length === 0) return
      
      html += `
        <div class="resource-section">
          <div class="section-header">
            <div class="section-title">
              <span>${sourceLabels[source]}</span>
              <span class="source-badge badge-${source}">${source}</span>
            </div>
            <div class="resource-count">${resources.length} items</div>
          </div>
          <div class="resource-grid">
            ${resources.map(resource => this.renderResourceCard(resource)).join('')}
          </div>
        </div>
      `
    })
    
    container.innerHTML = html
    
    // 添加卡片点击事件
    this.attachCardListeners()
  }
  
  groupBySource(resources) {
    const grouped = {
      system: [],
      project: [],
      user: []
    }
    
    resources.forEach(resource => {
      if (grouped[resource.source]) {
        grouped[resource.source].push(resource)
      }
    })
    
    return grouped
  }
  
  renderResourceCard(resource) {
    const typeClass = resource.type === 'role' ? 'type-role' : 'type-tool'
    const typeLabel = resource.type === 'role' ? 'Role' : 'Tool'
    const icon = resource.type === 'role' ? '👤' : '🔧'
    
    return `
      <div class="resource-card" data-id="${resource.id}" data-type="${resource.type}">
        <div class="resource-type ${typeClass}">${typeLabel}</div>
        <div class="resource-name">${icon} ${resource.name}</div>
        <div class="resource-description">${resource.description || 'No description'}</div>
        <div class="resource-tags">
          ${(resource.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `
  }
  
  setupEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById('searchInput')
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase()
      this.filterResources()
    })
    
    // Tab 切换
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // 更新活动状态
        tabs.forEach(t => t.classList.remove('active'))
        e.target.classList.add('active')
        
        // 应用筛选
        this.currentFilter = e.target.dataset.filter
        this.filterResources()
      })
    })
  }
  
  filterResources() {
    if (!this.allResources) return
    
    this.filteredResources = this.allResources.filter(resource => {
      // 类型筛选
      if (this.currentFilter !== 'all') {
        if (this.currentFilter === 'roles' && resource.type !== 'role') return false
        if (this.currentFilter === 'tools' && resource.type !== 'tool') return false
      }
      
      // 搜索筛选
      if (this.searchQuery) {
        const searchText = [
          resource.name,
          resource.description,
          ...(resource.tags || [])
        ].join(' ').toLowerCase()
        
        if (!searchText.includes(this.searchQuery)) return false
      }
      
      return true
    })
    
    this.renderResources()
  }
  
  attachCardListeners() {
    const cards = document.querySelectorAll('.resource-card')
    cards.forEach(card => {
      card.addEventListener('click', async (e) => {
        const id = card.dataset.id
        const type = card.dataset.type
        
        if (type === 'role') {
          await this.activateRole(id)
        } else if (type === 'tool') {
          await this.executeTool(id)
        }
      })
    })
  }
  
  async activateRole(roleId) {
    try {
      const result = await window.electronAPI.activateRole(roleId)
      
      if (result.success) {
        this.showSuccess(`Role "${roleId}" activated successfully!`)
      } else {
        this.showError(result.message || 'Failed to activate role')
      }
    } catch (error) {
      console.error('Error activating role:', error)
      this.showError('Error activating role')
    }
  }
  
  async executeTool(toolId) {
    // TODO: 实现工具执行界面
    this.showInfo(`Tool execution for "${toolId}" coming soon!`)
  }
  
  showSuccess(message) {
    this.showNotification(message, 'success')
  }
  
  showError(message) {
    this.showNotification(message, 'error')
  }
  
  showInfo(message) {
    this.showNotification(message, 'info')
  }
  
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `
    
    document.body.appendChild(notification)
    
    // 3秒后自动消失
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }
}

// 添加动画样式
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)

// 初始化资源管理器
window.addEventListener('DOMContentLoaded', () => {
  new ResourceManager()
})