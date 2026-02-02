<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function index(int $userId, Request $request)
    {
        $unreadOnly = $request->query('unread_only') === 'true';
        $limit = (int) ($request->query('limit') ?? 50);

        $notifications = $this->notificationService->getForUser($userId, $unreadOnly, $limit);

        return $this->responseJSON($notifications, 'success', 200);
    }

    public function unreadCount(int $userId)
    {
        $count = $this->notificationService->getUnreadCount($userId);

        return $this->responseJSON(['count' => $count], 'success', 200);
    }

    public function markAsRead(int $userId, int $notificationId)
    {
        $notification = $this->notificationService->markAsRead($notificationId, $userId);

        if (! $notification) {
            return $this->responseJSON(null, 'Notification not found', 404);
        }

        return $this->responseJSON($notification, 'Notification marked as read', 200);
    }

    public function markAllAsRead(int $userId)
    {
        $count = $this->notificationService->markAllAsRead($userId);

        return $this->responseJSON(['marked_count' => $count], 'All notifications marked as read', 200);
    }

    public function destroy(int $userId, int $notificationId)
    {
        $deleted = $this->notificationService->delete($notificationId, $userId);

        if (! $deleted) {
            return $this->responseJSON(null, 'Notification not found', 404);
        }

        return $this->responseJSON(null, 'Notification deleted', 200);
    }
}
