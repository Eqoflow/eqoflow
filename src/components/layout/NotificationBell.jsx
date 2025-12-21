import React, { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Heart,
  MessageSquare,
  Repeat,
  UserPlus,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { NotificationContext } from '../contexts/NotificationContext';
import { maskEmail } from '../utils/maskData';

export default function NotificationBell({ user, isMobile }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { notificationUpdate } = useContext(NotificationContext);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, notificationUpdate]);

  const loadNotifications = async () => {
    try {
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: user.email },
        "-created_date",
        20
      );

      // Mask actor emails in notifications
      const maskedNotifs = await Promise.all(
        notifs.map(async (notif) => ({
          ...notif,
          actor_email: await maskEmail(notif.actor_email)
        }))
      );

      setNotifications(maskedNotifs);
      setUnreadCount(maskedNotifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      await loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifs.map(n =>
          base44.entities.Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-pink-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'repost': return <Repeat className="w-4 h-4 text-green-400" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-400" />;
      case 'reward': return <Award className="w-4 h-4 text-yellow-400" />;
      case 'flag': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative header-icon-btn"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[500px] overflow-y-auto dark-card border-purple-500/20"
      >
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur-sm p-3 border-b border-purple-500/20 z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className={`p-4 cursor-pointer ${
                !notif.is_read ? 'bg-purple-500/10' : ''
              }`}
              onClick={() => {
                handleMarkAsRead(notif.id);
                if (notif.action_url) {
                  window.location.href = notif.action_url;
                }
              }}
            >
              <div className="flex gap-3 w-full">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium">
                      {notif.title || notif.message}
                    </p>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  {notif.actor_name && (
                    <p className="text-xs text-gray-400 mt-1">
                      from {notif.actor_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notif.created_date), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <div className="p-2">
              <Link to={createPageUrl("Feed")} className="block">
                <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300">
                  View All Notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}