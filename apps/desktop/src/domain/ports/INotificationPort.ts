export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationOptions {
  title?: string
  body: string
  type: NotificationType
  silent?: boolean
  timeout?: number
}

export interface INotificationPort {
  show(options: NotificationOptions): Promise<void>
  showInfo(message: string, title?: string): Promise<void>
  showSuccess(message: string, title?: string): Promise<void>
  showWarning(message: string, title?: string): Promise<void>
  showError(message: string, title?: string): Promise<void>
}