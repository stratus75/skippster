import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks';
import type { Notification } from '../../types';

interface NotificationBellProps {
  did: string | null;
}

export function NotificationBell({ did }: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications(did);

  // Load notifications on mount when user is authenticated
  React.useEffect(() => {
    if (did) {
      loadNotifications();
    }
  }, [did, loadNotifications]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'friend_request':
        return '👥';
      case 'friend_accepted':
        return '✓';
      case 'post_like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '@';
      case 'video_comment':
        return '🎬';
      case 'video_like':
        return '❤️';
      case 'subscription':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full flex items-center justify-center transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-social-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#242526] rounded-lg shadow-lg border border-[#3e4042] z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e4042]">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-social-500 hover:text-social-400"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-[#3a3b3c] transition-colors text-left ${
                    !notification.read ? 'bg-[#3a3b3c]/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-[#3a3b3c] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-gray-400 text-sm truncate">{notification.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-social-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[#3e4042]">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}