export interface Notification {
  id: string
  title: string
  content: string
  type: "info" | "success" | "warning" | "error"
  timestamp: number
  read: boolean
  link?: string
}

export interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
}
