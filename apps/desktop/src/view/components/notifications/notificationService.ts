import { Notification, NotificationStore } from "./types"

const STORAGE_KEY = "promptx_notifications"
const SHOWN_KEY = "promptx_notifications_shown"

// 默认通知数据
const defaultNotifications: Notification[] = [
  {
    id: "update-v2.2.0",
    title: "notifications.updateV220.title",
    content: "notifications.updateV220.content",
    type: "success",
    timestamp: Date.now(),
    read: false,
  },
  {
    id: "rolex-upgrade",
    title: "notifications.rolexUpgrade.title",
    content: "notifications.rolexUpgrade.content",
    type: "warning",
    timestamp: Date.now(),
    read: false,
  },
]

export const notificationService = {
  // 获取所有通知
  getNotifications(): Notification[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // 首次使用，初始化默认通知
    this.saveNotifications(defaultNotifications)
    return defaultNotifications
  },

  // 保存通知
  saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  },

  // 标记通知为已读
  markAsRead(id: string): void {
    const notifications = this.getNotifications()
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    this.saveNotifications(updated)
  },

  // 标记所有通知为已读
  markAllAsRead(): void {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => ({ ...n, read: true }))
    this.saveNotifications(updated)
  },

  // 获取未读数量
  getUnreadCount(): number {
    const notifications = this.getNotifications()
    return notifications.filter(n => !n.read).length
  },

  // 添加新通知
  addNotification(notification: Omit<Notification, "id" | "timestamp">): void {
    const notifications = this.getNotifications()
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      timestamp: Date.now(),
    }
    this.saveNotifications([newNotification, ...notifications])
  },

  // 删除通知
  deleteNotification(id: string): void {
    const notifications = this.getNotifications()
    const updated = notifications.filter(n => n.id !== id)
    this.saveNotifications(updated)
  },

  // 检查是否已显示过通知弹窗
  hasShownNotifications(): boolean {
    return localStorage.getItem(SHOWN_KEY) === "true"
  },

  // 标记已显示通知弹窗
  markAsShown(): void {
    localStorage.setItem(SHOWN_KEY, "true")
  },

  // 重置显示状态（用于测试）
  resetShownStatus(): void {
    localStorage.removeItem(SHOWN_KEY)
  },
}
