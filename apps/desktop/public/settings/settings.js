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

class ServerConfigSettings {
  constructor() {
    this.prevConfig = null
    this.init()
  }

  async init() {
    this.cacheElements()
    this.setupEventListeners()
    await this.loadCurrentConfig()
  }

  cacheElements() {
    this.hostInput = document.getElementById('server-host-input')
    this.portInput = document.getElementById('server-port-input')
    this.debugSwitch = document.getElementById('server-debug-switch')
    this.saveBtn = document.getElementById('server-config-save')
    this.resetBtn = document.getElementById('server-config-reset')
  }

  async loadCurrentConfig() {
    try {
      const cfg = await window.electronAPI.invoke('server-config:get')
      this.prevConfig = cfg
      if (this.hostInput) this.hostInput.value = cfg.host || '127.0.0.1'
      if (this.portInput) this.portInput.value = cfg.port || 5203
      if (this.debugSwitch) this.debugSwitch.checked = Boolean(cfg.debug)
    } catch (error) {
      console.error('Failed to load server config:', error)
      this.showError('加载服务器配置失败，请重试')
    }
  }

  setupEventListeners() {
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', async () => {
        const host = (this.hostInput?.value || '').trim()
        const port = parseInt(this.portInput?.value || '0', 10)
        const debug = !!this.debugSwitch?.checked

        // 简单前端校验，避免明显错误
        if (!host) {
          this.showError('主机地址不能为空')
          return
        }
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          this.showError('端口必须是 1-65535 的整数')
          return
        }

        try {
          const updated = await window.electronAPI.invoke('server-config:update', { host, port, debug })
          this.prevConfig = updated
          this.showStatus('配置已保存并重启服务')
        } catch (error) {
          console.error('Failed to save server config:', error)
          this.showError('保存配置失败，请检查日志')
          // 回滚 UI
          if (this.prevConfig) {
            if (this.hostInput) this.hostInput.value = this.prevConfig.host || '127.0.0.1'
            if (this.portInput) this.portInput.value = this.prevConfig.port || 5203
            if (this.debugSwitch) this.debugSwitch.checked = Boolean(this.prevConfig.debug)
          }
        }
      })
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', async () => {
        try {
          const defaults = await window.electronAPI.invoke('server-config:reset')
          this.prevConfig = defaults
          if (this.hostInput) this.hostInput.value = defaults.host || '127.0.0.1'
          if (this.portInput) this.portInput.value = defaults.port || 5203
          if (this.debugSwitch) this.debugSwitch.checked = Boolean(defaults.debug)
          this.showStatus('已重置为默认并重启服务')
        } catch (error) {
          console.error('Failed to reset server config:', error)
          this.showError('重置失败，请检查日志')
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
  new ServerConfigSettings()
})
