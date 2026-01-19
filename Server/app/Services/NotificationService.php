<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Collection;

class NotificationService
{
    public const TYPE_SWAP_REQUEST = 'swap_request';

    public const TYPE_SWAP_APPROVED = 'swap_approved';

    public const TYPE_SWAP_REJECTED = 'swap_rejected';

    public const TYPE_SWAP_CANCELLED = 'swap_cancelled';

    public const TYPE_SWAP_AWAITING = 'swap_awaiting';

    public const TYPE_SHIFT_ASSIGNED = 'shift_assigned';

    public const TYPE_SHIFT_UPDATED = 'shift_updated';

    public const TYPE_SHIFT_REMINDER = 'shift_reminder';

    public const TYPE_FATIGUE_WARNING = 'fatigue_warning';

    public const TYPE_WELLNESS_ALERT = 'wellness_alert';

    public const TYPE_SCHEDULE_PUBLISHED = 'schedule_published';

    public const TYPE_SYSTEM = 'system';

    public const TYPE_WEEKLY_INSIGHT = 'weekly_insight';

    public function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        string $priority = 'normal',
        ?string $referenceType = null,
        ?int $referenceId = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'priority' => $priority,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }

    public function sendToMany(
        array $userIds,
        string $type,
        string $title,
        string $message,
        string $priority = 'normal',
        ?string $referenceType = null,
        ?int $referenceId = null
    ): int {
        if (empty($userIds)) {
            return 0;
        }

        $notifications = [];
        $now = now();

        foreach ($userIds as $userId) {
            $notifications[] = [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'priority' => $priority,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        Notification::insert($notifications);

        return count($notifications);
    }

    public function getForUser(int $userId, bool $unreadOnly = false, int $limit = 50): Collection
    {
        $query = Notification::where('user_id', $userId)
            ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 END")
            ->orderByDesc('created_at');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        return $query->limit($limit)->get();
    }

    public function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    public function markAsRead(int $notificationId, int $userId): ?Notification
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if (! $notification) {
            return null;
        }

        $notification->update(['is_read' => true]);

        return $notification->fresh();
    }

    public function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function delete(int $notificationId, int $userId): bool
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    public function deleteOlderThan(int $days): int
    {
        return Notification::where('is_read', true)
            ->where('created_at', '<', now()->subDays($days))
            ->delete();
    }
}
