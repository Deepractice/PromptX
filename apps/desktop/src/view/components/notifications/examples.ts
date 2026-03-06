// 通知系统使用示例
// Example usage of the notification system

import { notificationService } from "@/components/notifications"

// 示例 1: 添加一条信息通知
// Example 1: Add an info notification
export function addInfoNotification() {
  notificationService.addNotification({
    title: "notifications.info.title",
    content: "notifications.info.content",
    type: "info",
    read: false,
  })
}

// 示例 2: 添加一条成功通知
// Example 2: Add a success notification
export function addSuccessNotification() {
  notificationService.addNotification({
    title: "notifications.success.title",
    content: "notifications.success.content",
    type: "success",
    read: false,
  })
}

// 示例 3: 添加一条警告通知
// Example 3: Add a warning notification
export function addWarningNotification() {
  notificationService.addNotification({
    title: "notifications.warning.title",
    content: "notifications.warning.content",
    type: "warning",
    read: false,
  })
}

// 示例 4: 添加一条错误通知
// Example 4: Add an error notification
export function addErrorNotification() {
  notificationService.addNotification({
    title: "notifications.error.title",
    content: "notifications.error.content",
    type: "error",
    read: false,
  })
}

// 示例 5: 获取未读通知数量
// Example 5: Get unread notification count
export function getUnreadCount() {
  const count = notificationService.getUnreadCount()
  console.log(`Unread notifications: ${count}`)
  return count
}

// 示例 6: 标记所有通知为已读
// Example 6: Mark all notifications as read
export function markAllAsRead() {
  notificationService.markAllAsRead()
  console.log("All notifications marked as read")
}

// 示例 7: 重置"已显示"状态（用于测试）
// Example 7: Reset shown status (for testing)
export function resetShownStatus() {
  notificationService.resetShownStatus()
  console.log("Notification shown status reset - will auto-show on next app launch")
}
