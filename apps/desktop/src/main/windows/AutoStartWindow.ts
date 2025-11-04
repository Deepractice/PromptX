/**
 * @fileoverview 
 * 自启动窗口管理器
 * 负责处理自启动相关的 IPC 通信
 * 
 * @author PromptX Team
 * @version 1.0.0
 */

import { IpcMainInvokeEvent, ipcMain } from 'electron'
import { AutoStartService } from '~/main/application/AutoStartService'
import { t } from '~/main/i18n'

/**
 * 自启动窗口管理器
 * 
 * 此类负责注册和处理自启动功能相关的 IPC 处理程序，
 * 遵循与 ResourceListWindow 相同的架构模式
 * 
 * @class AutoStartWindow
 */
export class AutoStartWindow {
  private static handlersRegistered = false

  /**
   * 创建 AutoStartWindow 的新实例
   * 
   * @constructor
   * @param {AutoStartService} autoStartService - 自启动服务实例
   */
  constructor(private readonly autoStartService: AutoStartService) {
    this.setupIpcHandlers()
  }

  /**
   * 设置 IPC 处理程序
   * 
   * @private
   */
  private setupIpcHandlers(): void {
    // 防止重复注册
    if (AutoStartWindow.handlersRegistered) {
      return
    }
    AutoStartWindow.handlersRegistered = true

    // 启用自启动
    ipcMain.handle('auto-start:enable', async (_: IpcMainInvokeEvent) => {
      try {
        await this.autoStartService.enableAutoStart()
        return {
          success: true,
          message: t('autoStart.enabled')
        }
      } catch (error: any) {
        console.error('Failed to enable auto-start:', error)
        return {
          success: false,
          error: error.message || t('autoStart.enableFailed')
        }
      }
    })

    // 禁用自启动
    ipcMain.handle('auto-start:disable', async (_: IpcMainInvokeEvent) => {
      try {
        await this.autoStartService.disableAutoStart()
        return {
          success: true,
          message: t('autoStart.disabled')
        }
      } catch (error: any) {
        console.error('Failed to disable auto-start:', error)
        return {
          success: false,
          error: error.message || t('autoStart.disableFailed')
        }
      }
    })

    // 获取自启动状态
    ipcMain.handle('auto-start:status', async (_: IpcMainInvokeEvent) => {
      try {
        const isEnabled = await this.autoStartService.isAutoStartEnabled()
        return {
          success: true,
          data: {
            enabled: isEnabled
          }
        }
      } catch (error: any) {
        console.error('Failed to get auto-start status:', error)
        return {
          success: false,
          error: error.message || t('autoStart.getStatusFailed')
        }
      }
    })

    // 切换自启动状态
    ipcMain.handle('auto-start:toggle', async (_: IpcMainInvokeEvent) => {
      try {
        const newStatus = await this.autoStartService.toggleAutoStart()
        return {
          success: true,
          data: {
            enabled: newStatus
          },
          message: newStatus ? t('autoStart.enabled') : t('autoStart.disabled')
        }
      } catch (error: any) {
        console.error('Failed to toggle auto-start:', error)
        return {
          success: false,
          error: error.message || t('autoStart.toggleFailed')
        }
      }
    })
  }

  /**
   * 清理资源
   * 
   * @public
   */
  cleanup(): void {
    // 如果需要的话，可以在这里添加清理逻辑
    // 目前 IPC 处理程序不需要特殊清理
  }
}