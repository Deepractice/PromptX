import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Info, CheckCircle, AlertTriangle, XCircle, X, Check } from "lucide-react"
import { Notification } from "./types"
import { notificationService } from "./notificationService"
import { cn } from "@/components/agentx-ui/utils/utils"

interface NotificationListProps {
  isOpen: boolean
  onClose: () => void
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />
  }
}

const getNotificationBadgeVariant = (type: Notification["type"]) => {
  switch (type) {
    case "info":
      return "default"
    case "success":
      return "default"
    case "warning":
      return "destructive"
    case "error":
      return "destructive"
  }
}

export function NotificationList({ isOpen, onClose }: NotificationListProps) {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = () => {
    const data = notificationService.getNotifications()
    setNotifications(data)
  }

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    loadNotifications()
  }

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
    loadNotifications()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t("notifications.time.justNow")
    if (minutes < 60) return t("notifications.time.minutesAgo", { count: minutes })
    if (hours < 24) return t("notifications.time.hoursAgo", { count: hours })
    if (days < 7) return t("notifications.time.daysAgo", { count: days })
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{t("notifications.title")}</DialogTitle>
              <DialogDescription>
                {unreadCount > 0
                  ? t("notifications.unreadCount", { count: unreadCount })
                  : t("notifications.allRead")}
              </DialogDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {t("notifications.markAllRead")}
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("notifications.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    notification.read
                      ? "bg-background"
                      : "bg-muted/50 border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {t(notification.title)}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t(notification.content)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            {t("notifications.markRead")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
