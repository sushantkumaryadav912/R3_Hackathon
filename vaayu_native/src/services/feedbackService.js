import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class FeedbackService {
  async submitAlertFeedback(alertId, userId, wasHelpful, location, alertType = 'weather') {
    try {
      const feedbackData = {
        alertId,
        userId,
        wasHelpful,
        location,
        alertType,
        timestamp: new Date(),
        feedbackType: 'alert_helpfulness',
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        }
      };

      // Store in Firestore
      const docRef = await addDoc(collection(db, 'user_feedback'), feedbackData);

      // Send to backend for RL model training
      await this.sendFeedbackToRL(feedbackData);

      // Remove from pending feedback
      await this.removePendingFeedback(alertId);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Store locally if network fails
      await this.storeFeedbackLocally(feedbackData);
      
      return { success: false, error: error.message };
    }
  }

  async sendFeedbackToRL(feedbackData) {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: feedbackData.alertId,
          userId: feedbackData.userId,
          wasHelpful: feedbackData.wasHelpful,
          location: feedbackData.location,
          timestamp: feedbackData.timestamp.toISOString(),
          alertType: feedbackData.alertType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending feedback to RL service:', error);
      throw error;
    }
  }

  async storeFeedbackLocally(feedbackData) {
    try {
      const localFeedback = await AsyncStorage.getItem('localFeedback');
      const feedback = localFeedback ? JSON.parse(localFeedback) : [];
      
      feedback.push({
        ...feedbackData,
        timestamp: feedbackData.timestamp.toISOString(),
        synced: false,
      });

      await AsyncStorage.setItem('localFeedback', JSON.stringify(feedback));
    } catch (error) {
      console.error('Error storing feedback locally:', error);
    }
  }

  async syncLocalFeedback() {
    try {
      const localFeedback = await AsyncStorage.getItem('localFeedback');
      if (!localFeedback) return;

      const feedback = JSON.parse(localFeedback);
      const unsyncedFeedback = feedback.filter(f => !f.synced);

      for (const feedbackItem of unsyncedFeedback) {
        try {
          await this.sendFeedbackToRL(feedbackItem);
          
          // Store in Firestore
          await addDoc(collection(db, 'user_feedback'), {
            ...feedbackItem,
            timestamp: new Date(feedbackItem.timestamp),
          });

          // Mark as synced
          feedbackItem.synced = true;
        } catch (error) {
          console.error('Error syncing feedback item:', error);
        }
      }

      // Update local storage
      await AsyncStorage.setItem('localFeedback', JSON.stringify(feedback));
    } catch (error) {
      console.error('Error syncing local feedback:', error);
    }
  }

  async getPendingFeedbackRequests(userId) {
    try {
      const pendingFeedback = await AsyncStorage.getItem('pendingAlertFeedback');
      if (!pendingFeedback) return [];

      const alerts = JSON.parse(pendingFeedback);
      
      // Filter alerts that need feedback (received more than 1 hour ago, less than 24 hours ago)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return alerts.filter(alert => {
        const receivedAt = new Date(alert.receivedAt);
        return receivedAt <= oneHourAgo && 
               receivedAt >= oneDayAgo && 
               !alert.feedbackRequested;
      });
    } catch (error) {
      console.error('Error getting pending feedback requests:', error);
      return [];
    }
  }

  async removePendingFeedback(alertId) {
    try {
      const pendingFeedback = await AsyncStorage.getItem('pendingAlertFeedback');
      if (!pendingFeedback) return;

      const alerts = JSON.parse(pendingFeedback);
      const updatedAlerts = alerts.filter(alert => alert.alertId !== alertId);

      await AsyncStorage.setItem('pendingAlertFeedback', JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Error removing pending feedback:', error);
    }
  }

  async getUserFeedbackHistory(userId) {
    try {
      const q = query(
        collection(db, 'user_feedback'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const feedback = [];

      querySnapshot.forEach((doc) => {
        feedback.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return feedback;
    } catch (error) {
      console.error('Error getting user feedback history:', error);
      return [];
    }
  }

  async submitGeneralFeedback(userId, feedbackType, rating, comments, location) {
    try {
      const feedbackData = {
        userId,
        feedbackType,
        rating,
        comments,
        location,
        timestamp: new Date(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        }
      };

      const docRef = await addDoc(collection(db, 'general_feedback'), feedbackData);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error submitting general feedback:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FeedbackService();
