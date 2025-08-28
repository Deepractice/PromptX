import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'
import { ResourceService } from '~/main/application/ResourceService'
import { Resource } from '~/main/domain/Resource'
import * as path from 'path'

/**
 * Resource List Window - 资源管理窗口
 */
export class ResourceListWindow {
  private window: BrowserWindow | null = null
  private static handlersRegistered = false
  
  constructor(private resourceService: ResourceService) {
    this.setupIpcHandlers()
  }
  
  private setupIpcHandlers(): void {
    // 防止重复注册
    if (ResourceListWindow.handlersRegistered) return
    ResourceListWindow.handlersRegistered = true
    
    // 获取分组资源
    ipcMain.handle('resources:getGrouped', async () => {
      try {
        const grouped = await this.resourceService.getGroupedResources()
        const stats = await this.resourceService.getStatistics()
        
        return {
          success: true,
          data: {
            grouped,
            statistics: stats
          }
        }
      } catch (error: any) {
        console.error('Failed to get grouped resources:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })
    
    // 搜索资源
    ipcMain.handle('resources:search', async (_: IpcMainInvokeEvent, query: string) => {
      try {
        const resources = await this.resourceService.searchResources(query)
        return {
          success: true,
          data: resources
        }
      } catch (error: any) {
        console.error('Failed to search resources:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })
    
    // 激活角色
    ipcMain.handle('resources:activateRole', async (_: IpcMainInvokeEvent, roleId: string) => {
      try {
        const result = await this.resourceService.activateRole(roleId)
        return result
      } catch (error: any) {
        console.error('Failed to activate role:', error)
        return {
          success: false,
          message: error.message
        }
      }
    })
    
    // 执行工具
    ipcMain.handle('resources:executeTool', async (_: IpcMainInvokeEvent, toolId: string, parameters?: any) => {
      try {
        const result = await this.resourceService.executeTool(toolId, parameters)
        return result
      } catch (error: any) {
        console.error('Failed to execute tool:', error)
        return {
          success: false,
          message: error.message
        }
      }
    })
    
    // 获取资源统计
    ipcMain.handle('resources:getStatistics', async () => {
      try {
        const stats = await this.resourceService.getStatistics()
        return {
          success: true,
          data: stats
        }
      } catch (error: any) {
        console.error('Failed to get statistics:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })
  }
  
  show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
      return
    }
    
    this.createWindow()
  }
  
  hide(): void {
    this.window?.hide()
  }
  
  close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
    }
    this.window = null
  }
  
  private createWindow(): void {
    const preloadPath = path.join(__dirname, '../preload/preload.cjs')
    
    this.window = new BrowserWindow({
      width: 900,
      height: 700,
      title: 'PromptX Resources - 资源管理',
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      },
      show: false,
      resizable: true,
      minimizable: true,
      maximizable: true,
      center: true
    })
    
    // 加载资源管理页面
    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:5173/resources.html')
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/resources.html'))
    }
    
    this.window.once('ready-to-show', () => {
      this.window?.show()
    })
    
    this.window.on('closed', () => {
      this.window = null
    })
  }
}