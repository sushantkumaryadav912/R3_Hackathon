import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, 
  Animated, Dimensions, PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { formatAlertDuration } from '../utils/alertTypes';
import { useNotification } from '../context/NotificationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FeedbackModal = ({ visible, alert, onClose, userId, location }) => {
  const { submitFeedback } = useNotification();
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [backdropAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setSelectedRating(null);
      
      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        handleClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleFeedbackSubmit = async (wasHelpful) => {
    if (!alert || !userId || submitting) return;

    setSubmitting(true);
    
    try {
      const result = await submitFeedback(alert.id, wasHelpful);
      
      if (result.success) {
        setSubmitted(true);
        setSelectedRating(wasHelpful);
        
        // Auto close after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeedbackContent = () => {
    if (submitted) {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>
            Your feedback helps us improve weather alerts for everyone
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.feedbackContainer}>
        {/* Alert Info */}
        <View style={styles.alertInfo}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={24} color="#FF6B35" />
            <Text style={styles.alertTitle}>{alert?.title}</Text>
          </View>
          <Text style={styles.alertMessage} numberOfLines={3}>
            {alert?.message}
          </Text>
          <Text style={styles.alertTime}>
            {formatAlertDuration(alert)} • {location?.address?.city || 'Your area'}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Was this alert helpful?</Text>
          <Text style={styles.questionSubtitle}>
            Your feedback helps our AI learn and improve future alerts
          </Text>
        </View>

        {/* Rating Options */}
        <View style={styles.ratingContainer}>
          <TouchableOpacity
            style={[
              styles.ratingButton,
              styles.negativeButton,
              submitting && styles.disabledButton
            ]}
            onPress={() => handleFeedbackSubmit(false)}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF5252']}
              style={styles.ratingGradient}
            >
              <Ionicons name="thumbs-down" size={32} color="#FFFFFF" />
              <Text style={styles.ratingButtonText}>Not Helpful</Text>
              <Text style={styles.ratingButtonSubtext}>
                This alert wasn't useful for me
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ratingButton,
              styles.positiveButton,
              submitting && styles.disabledButton
            ]}
            onPress={() => handleFeedbackSubmit(true)}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.ratingGradient}
            >
              <Ionicons name="thumbs-up" size={32} color="#FFFFFF" />
              <Text style={styles.ratingButtonText}>Helpful</Text>
              <Text style={styles.ratingButtonSubtext}>
                This alert was useful for me
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {submitting && (
          <View style={styles.submittingOverlay}>
            <View style={styles.submittingContent}>
              <Ionicons name="cloud-upload-outline" size={32} color="#4A90E2" />
              <Text style={styles.submittingText}>Sending feedback...</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (!visible || !alert) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Alert Feedback</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {renderFeedbackContent()}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  feedbackContainer: {
    flex: 1,
  },
  alertInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  ratingButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  ratingGradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  ratingButtonSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  submittingContent: {
    alignItems: 'center',
  },
  submittingText: {
    fontSize: 16,
    color: '#4A90E2',
    marginTop: 12,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default FeedbackModal;
