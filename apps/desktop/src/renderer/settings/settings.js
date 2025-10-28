class AutoStartSettings {
  constructor() {
    this.init()
  }

  async init() {
    this.setupEventListeners()
    await this.loadCurrentStatus()
  }

  async loadCurrentStatus() {
    try {
      const isEnabled = await window.electronAPI.invoke('auto-start:status')
      this.updateSwitch(isEnabled)
    } catch (error) {
      console.error('Failed to load auto-start status:', error)
      this.showError('加载设置失败，请重试')
    }
  }
11
  updateSwitch(enabled) {
    const switchElement = document.querySelector('#auto-start-switch')
    if (switchElement) {
      switchElement.checked = enabled
    }
  }

  setupEventListeners() {
    const switchElement = document.querySelector('#auto-start-switch')
    if (switchElement) {
      switchElement.addEventListener('change', async (event) => {
        const enabled = event.target.checked
        try {
          if (enabled) {
            await window.electronAPI.invoke('auto-start:enable')
            this.showStatus('已启用开机自启动')
          } else {
            await window.electronAPI.invoke('auto-start:disable')
            this.showStatus('已禁用开机自启动')
          }
        } catch (error) {
          console.error('Failed to toggle auto-start:', error)
          this.showError('操作失败，请重试')
          switchElement.checked = !enabled // 回滚状态
        }
      })
    }
  }

  showStatus(message) {
    const statusDiv = document.getElementById('status-message')
    const statusText = document.getElementById('status-text')
    
    if (statusDiv && statusText) {
      statusDiv.className = 'status-message success'
      statusText.textContent = message
      
      setTimeout(() => {
        statusDiv.className = 'status-message hidden'
      }, 3000)
    }
  }

  showError(message) {
    const statusDiv = document.getElementById('status-message')
    const statusText = document.getElementById('status-text')
    
    if (statusDiv && statusText) {
      statusDiv.className = 'status-message error'
      statusText.textContent = message
      
      setTimeout(() => {
        statusDiv.className = 'status-message hidden'
      }, 3000)
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new AutoStartSettings()
})
