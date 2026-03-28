import { Notification, NotificationStore } from "./types"

const STORAGE_KEY = "promptx_notifications"
const SHOWN_KEY = "promptx_notifications_shown"

// 默认通知数据
const defaultNotifications: Notification[] = [
  {
    id: "update-v2.3.1",
    title: "notifications.updateV231.title",
    content: "notifications.updateV231.content",
    type: "success",
    timestamp: Date.now(),
    read: false,
  },
  {
    id: "update-v2.3.0",
    title: "notifications.updateV230.title",
    content: "notifications.updateV230.content",
    type: "success",
    timestamp: Date.now(),
    read: false,
  },
  {
    id: "update-v2.2.1",
    title: "notifications.updateV221.title",
    content: "notifications.updateV221.content",
    type: "success",
    timestamp: Date.now(),
    read: false,
  },
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
    let existingNotifications: Notification[] = []

    if (stored) {
      existingNotifications = JSON.parse(stored)
    }

    // 检查是否有新的默认通知需要添加
    const existingIds = new Set(existingNotifications.map(n => n.id))
    const newNotifications = defaultNotifications.filter(n => !existingIds.has(n.id))

    if (newNotifications.length > 0) {
      // 有新通知，合并并保存
      const merged = [...newNotifications, ...existingNotifications]
      this.saveNotifications(merged)
      return merged
    }

    // 没有新通知
    if (existingNotifications.length > 0) {
      return existingNotifications
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
