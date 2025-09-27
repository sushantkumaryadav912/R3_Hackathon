import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';
import FeedbackService from '../services/feedbackService';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { currentLocation } = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeNotifications();
    
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingFeedback();
      
      // Check for pending feedback every hour
      const interval = setInterval(loadPendingFeedback, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      setPermissionStatus('granted');
      
      // Load stored notifications
      await loadStoredNotifications();
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setPermissionStatus('denied');
    }
  };

  const loadStoredNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  };

  const loadPendingFeedback = async () => {
    if (!user) return;

    try {
      const pending = await FeedbackService.getPendingFeedbackRequests(user.uid);
      setPendingFeedback(pending);
    } catch (error) {
      console.error('Error loading pending feedback:', error);
    }
  };

  const addNotification = async (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Store notifications locally
    const updatedNotifications = [newNotification, ...notifications];
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));

    return newNotification;
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );

    // Update stored notifications
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await AsyncStorage.removeItem('notifications');
  };

  const scheduleWeatherAlert = async (alertData) => {
    try {
      // Check user preferences
      if (!userProfile?.preferences?.notifications?.weatherAlerts) {
        return { success: false, reason: 'Weather alerts disabled' };
      }

      // Check quiet hours
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const quietHours = userProfile?.preferences?.notifications?.quietHours;
      
      if (quietHours?.enabled) {
        const startTime = parseInt(quietHours.start.replace(':', ''));
        const endTime = parseInt(quietHours.end.replace(':', ''));
        
        const isQuietTime = (startTime <= endTime) 
          ? (currentTime >= startTime && currentTime <= endTime)
          : (currentTime >= startTime || currentTime <= endTime);
          
        if (isQuietTime && alertData.severity !== 'critical') {
          // Schedule for after quiet hours
          const endHour = parseInt(quietHours.end.split(':')[0]);
          const endMinute = parseInt(quietHours.end.split(':')[1]);
          
          const scheduleTime = new Date();
          scheduleTime.setHours(endHour, endMinute, 0, 0);
          
          if (scheduleTime <= now) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
          }
          
          return await NotificationService.scheduleLocalNotification(
            alertData.title,
            alertData.message,
            { ...alertData, type: 'weather_alert' },
            { trigger: { date: scheduleTime } }
          );
        }
      }

      // Send immediate notification
      return await NotificationService.scheduleLocalNotification(
        alertData.title,
        alertData.message,
        { ...alertData, type: 'weather_alert' }
      );
    } catch (error) {
      console.error('Error scheduling weather alert:', error);
      return { success: false, error: error.message };
    }
  };

  const requestFeedback = (alertData) => {
    // Add to local notifications for UI display
    addNotification({
      type: 'feedback_request',
      title: 'How was this alert?',
      message: 'Help us improve by rating this weather alert',
      data: alertData,
      priority: 'low',
    });
  };

  const submitFeedback = async (alertId, wasHelpful) => {
    if (!user || !currentLocation) {
      return { success: false, error: 'Missing user or location data' };
    }

    try {
      setLoading(true);
      
      const result = await FeedbackService.submitAlertFeedback(
        alertId,
        user.uid,
        wasHelpful,
        currentLocation
      );

      if (result.success) {
        // Remove from pending feedback
        setPendingFeedback(prev => prev.filter(item => item.alertId !== alertId));
        
        // Add success notification
        addNotification({
          type: 'feedback_success',
          title: 'Thank you!',
          message: 'Your feedback helps us improve weather alerts',
          priority: 'low',
        });
      }

      return result;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  const removeNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    
    const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const value = {
    notifications,
    pendingFeedback,
    permissionStatus,
    loading,
    unreadCount: getUnreadCount(),
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    scheduleWeatherAlert,
    requestFeedback,
    submitFeedback,
    getNotificationsByType,
    loadPendingFeedback,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
