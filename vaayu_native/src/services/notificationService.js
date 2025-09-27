import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    await this.registerForPushNotifications();
    this.setupNotificationListeners();
  }

  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('weather-alerts', {
        name: 'Weather Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push token for push notification!');
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;

      // Store token locally
      await AsyncStorage.setItem('expoPushToken', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  handleNotificationReceived(notification) {
    const { data } = notification.request.content;
    
    // Handle different types of notifications
    if (data?.type === 'weather_alert') {
      // Store alert for later feedback collection
      this.storeAlertForFeedback(data);
    }
  }

  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate to appropriate screen based on notification type
    if (data?.type === 'weather_alert' && data?.alertId) {
      // This would be handled by navigation service
      console.log('Navigate to alert details:', data.alertId);
    }
  }

  async storeAlertForFeedback(alertData) {
    try {
      const pendingFeedback = await AsyncStorage.getItem('pendingAlertFeedback');
      const alerts = pendingFeedback ? JSON.parse(pendingFeedback) : [];
      
      alerts.push({
        ...alertData,
        receivedAt: new Date().toISOString(),
        feedbackRequested: false,
      });

      await AsyncStorage.setItem('pendingAlertFeedback', JSON.stringify(alerts));
    } catch (error) {
      console.error('Error storing alert for feedback:', error);
    }
  }

  async scheduleLocalNotification(title, body, data = {}, options = {}) {
    const defaultOptions = {
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      channelId: data.type === 'weather_alert' ? 'weather-alerts' : 'general',
    };

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: defaultOptions.sound,
          priority: defaultOptions.priority,
        },
        trigger: options.trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export default new NotificationService();
