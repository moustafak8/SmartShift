import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Megaphone,
  Trash2,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Layout } from "../components/Sidebar";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAuth } from "../hooks/context/AuthContext";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "../hooks/useNotification";
import type { Notification, NotificationType } from "../hooks/types/notification";

type FilterType = "all" | "unread";

export function Notifications() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const { notifications, isLoading, refetch } = useNotifications(
    userId,
    filter === "unread"
  );
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationConfig = (type: NotificationType) => {
    const configs: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
      swap_request: { icon: RefreshCw, color: "text-blue-600", bgColor: "bg-blue-50" },
      swap_approved: { icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
      swap_rejected: { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
      swap_cancelled: { icon: RefreshCw, color: "text-gray-600", bgColor: "bg-gray-50" },
      swap_awaiting: { icon: RefreshCw, color: "text-amber-600", bgColor: "bg-amber-50" },
      shift_assigned: { icon: Calendar, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      shift_updated: { icon: Calendar, color: "text-violet-600", bgColor: "bg-violet-50" },
      shift_reminder: { icon: Bell, color: "text-orange-600", bgColor: "bg-orange-50" },
      fatigue_warning: { icon: TrendingUp, color: "text-red-600", bgColor: "bg-red-50" },
      wellness_alert: { icon: Heart, color: "text-pink-600", bgColor: "bg-pink-50" },
      schedule_published: { icon: Calendar, color: "text-teal-600", bgColor: "bg-teal-50" },
      system: { icon: Megaphone, color: "text-gray-600", bgColor: "bg-gray-50" },
    };
    return configs[type] || configs.system;
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "normal":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.is_read && userId) {
      markAsReadMutation.mutate({ userId, notificationId: notification.id });
    }
  };

  const handleMarkAllAsRead = () => {
    if (userId) {
      markAllAsReadMutation.mutate(userId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    setNotificationToDelete(notificationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userId && notificationToDelete) {
      deleteMutation.mutate({ userId, notificationId: notificationToDelete });
    }
    setNotificationToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="px-7 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Notifications</h1>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "unread" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </Button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>


        
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = getNotificationConfig(notification.type as NotificationType);
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`p-4 border-l-4 rounded-xl shadow-sm ${getPriorityStyles(notification.priority)} 
                  cursor-pointer transition-all duration-200 hover:shadow-md
                  ${notification.is_read ? "bg-white" : "bg-blue-50/50"}`}
                onClick={() => handleMarkAsRead(notification)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm ${notification.is_read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {notification.message}
                        </p>
                        {notification.type.startsWith('swap_') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification);
                              navigate('/employee/swap-request');
                            }}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            View Swap Request
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        {notification.priority === "high" && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                      <button
                        onClick={(e) => handleDeleteClick(e, notification.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {filter === "unread"
                ? "You've read all your notifications. Great job staying on top of things!"
                : "When you receive notifications about shifts, swaps, or alerts, they'll appear here."}
            </p>
          </div>
        )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Layout>
  );
}
