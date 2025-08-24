import { Notification } from 'electron'
import type { INotificationPort, NotificationOptions, NotificationType } from '../../domain/ports/INotificationPort.js'

export class ElectronNotificationAdapter implements INotificationPort {
  async show(options: NotificationOptions): Promise<void> {
    if (!Notification.isSupported()) {
      console.log(`[${options.type}] ${options.title || ''}: ${options.body}`)
      return
    }

    const notification = new Notification({
      title: options.title || this.getDefaultTitle(options.type),
      body: options.body,
      silent: options.silent ?? false,
      icon: this.getIconForType(options.type)
    })

    notification.show()

    // Auto-close after timeout if specified
    if (options.timeout) {
      setTimeout(() => {
        notification.close()
      }, options.timeout)
    }
  }

  async showInfo(message: string, title?: string): Promise<void> {
    await this.show({
      type: 'info',
      title,
      body: message
    })
  }

  async showSuccess(message: string, title?: string): Promise<void> {
    await this.show({
      type: 'success',
      title,
      body: message
    })
  }

  async showWarning(message: string, title?: string): Promise<void> {
    await this.show({
      type: 'warning',
      title,
      body: message
    })
  }

  async showError(message: string, title?: string): Promise<void> {
    await this.show({
      type: 'error',
      title,
      body: message
    })
  }

  private getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case 'info':
        return 'Information'
      case 'success':
        return 'Success'
      case 'warning':
        return 'Warning'
      case 'error':
        return 'Error'
      default:
        return 'PromptX Desktop'
    }
  }

  private getIconForType(type: NotificationType): string | undefined {
    // TODO: Return actual icon paths based on type
    // For now, let Electron use default icons
    return undefined
  }
}