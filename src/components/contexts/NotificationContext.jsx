import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/entities/Notification';
import { User } from '@/entities/User';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and initial notifications
  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  // Poll for new notifications every 30 seconds when user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!document.hidden) { // Only poll when tab is visible
        checkForNewNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadUserAndNotifications = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser) {
        await loadNotifications(currentUser.email);
      }
    } catch (error) {
      console.error('Error loading user and notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async (userEmail) => {
    try {
      console.log('NotificationContext: Loading notifications for', userEmail);
      
      const fetchedNotifications = await Notification.filter(
        { recipient_email: userEmail },
        '-created_date',
        50 // Load more notifications for context
      );

      console.log('NotificationContext: Loaded', fetchedNotifications.length, 'notifications');

      setNotifications(fetchedNotifications);
      const unread = fetchedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);

      console.log('NotificationContext: Unread count:', unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkForNewNotifications = async () => {
    if (!user) return;

    try {
      const lastNotificationDate = notifications.length > 0 
        ? notifications[0].created_date 
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

      const newNotifications = await Notification.filter(
        { 
          recipient_email: user.email,
          created_date: { $gt: lastNotificationDate }
        },
        '-created_date',
        10
      );

      if (newNotifications.length > 0) {
        console.log('NotificationContext: Found', newNotifications.length, 'new notifications');
        
        // Merge new notifications with existing ones, avoiding duplicates
        const existingIds = new Set(notifications.map(n => n.id));
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
        
        if (uniqueNewNotifications.length > 0) {
          const updatedNotifications = [...uniqueNewNotifications, ...notifications].slice(0, 50);
          setNotifications(updatedNotifications);
          
          // Update unread count
          const unread = updatedNotifications.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { 
        is_read: true,
        read_at: new Date().toISOString()
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;

      // Update all unread notifications in parallel
      await Promise.all(
        unreadNotifications.map(notification =>
          Notification.update(notification.id, { 
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications: () => loadNotifications(user?.email),
    checkForNewNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications: () => loadUserAndNotifications()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
export { NotificationContext };