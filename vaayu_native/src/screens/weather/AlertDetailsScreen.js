import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Share, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getAlertConfig, formatAlertDuration } from '../../utils/alertTypes';
import { formatDate } from '../../utils/dateHelpers';
import FeedbackModal from '../../components/FeedbackModal';

const AlertDetailsScreen = ({ route, navigation }) => {
  const { alert } = route.params;
  const { submitFeedback } = useNotification();
  const { user } = useAuth();
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const config = getAlertConfig(alert.type);

  useEffect(() => {
    // Set navigation header with alert type color
    navigation.setOptions({
      headerStyle: {
        backgroundColor: config.color,
      },
      headerTitle: alert.title || 'Alert Details',
    });
  }, []);

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Weather Alert: ${alert.title}\n\n${alert.message}\n\nStay safe!`,
        title: 'Weather Alert from Vaayu',
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing alert:', error);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Services',
      'Call emergency services?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 108', 
          onPress: () => Linking.openURL('tel:108'),
          style: 'default'
        }
      ]
    );
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackModal(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return '#4CAF50';
      case 'moderate': return '#FFA500';
      case 'high': return '#FF6B35';
      case 'severe': return '#FF4444';
      case 'extreme': return '#DC143C';
      default: return '#666666';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'advisory': return '#4CAF50';
      case 'warning': return '#FFA500';
      case 'critical': return '#FF4444';
      case 'emergency': return '#DC143C';
      default: return config.color;
    }
  };

  const renderAlertHeader = () => (
    <LinearGradient
      colors={[config.color, `${config.color}CC`]}
      style={styles.headerGradient}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons name={config.icon} size={48} color="#FFFFFF" />
        </View>
        
        <View style={styles.alertHeaderInfo}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertTimestamp}>
            {formatAlertDuration(alert)} • {alert.location?.name || 'Your area'}
          </Text>
          
          <View style={styles.alertBadges}>
            {alert.severity && (
              <View style={[styles.badge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Text style={styles.badgeText}>{alert.severity.toUpperCase()}</Text>
              </View>
            )}
            
            {alert.priority && (
              <View style={[styles.badge, { backgroundColor: getPriorityColor(alert.priority) }]}>
                <Text style={styles.badgeText}>{alert.priority.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderAlertMessage = () => (
    <View style={styles.messageSection}>
      <Text style={styles.sectionTitle}>Alert Message</Text>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      
      {alert.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.alertDescription}>{alert.description}</Text>
        </View>
      )}
    </View>
  );

  const renderAlertDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Alert Details</Text>
      
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Issued</Text>
            <Text style={styles.detailValue}>
              {formatDate(new Date(alert.timestamp), 'full')}
            </Text>
          </View>
        </View>

        {alert.validUntil && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Valid Until</Text>
              <Text style={styles.detailValue}>
                {formatDate(new Date(alert.validUntil), 'full')}
              </Text>
            </View>
          </View>
        )}

        {alert.source && (
          <View style={styles.detailItem}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{alert.source}</Text>
            </View>
          </View>
        )}

        {alert.affectedAreas && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Affected Areas</Text>
              <Text style={styles.detailValue}>
                {Array.isArray(alert.affectedAreas) 
                  ? alert.affectedAreas.join(', ')
                  : alert.affectedAreas
                }
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderSafetyInstructions = () => {
    if (!alert.instructions || alert.instructions.length === 0) return null;

    return (
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Safety Instructions</Text>
        <View style={styles.instructionsContainer}>
          {alert.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionsSection}>
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#4A90E2" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        {alert.priority === 'emergency' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyButton]} 
            onPress={handleEmergencyCall}
          >
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              Emergency
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleFeedbackSubmit}
          disabled={feedbackSubmitted}
        >
          <Ionicons 
            name={feedbackSubmitted ? "checkmark-circle" : "thumbs-up-outline"} 
            size={20} 
            color={feedbackSubmitted ? "#4CAF50" : "#4A90E2"} 
          />
          <Text style={[
            styles.actionButtonText,
            feedbackSubmitted && { color: '#4CAF50' }
          ]}>
            {feedbackSubmitted ? 'Rated' : 'Rate Alert'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRelatedAlerts = () => {
    // This would show related alerts from the same area/type
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={config.color} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAlertHeader()}
        {renderAlertMessage()}
        {renderSafetyInstructions()}
        {renderAlertDetails()}
        {renderRelatedAlerts()}
      </ScrollView>

      {renderActionButtons()}

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        alert={alert}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackSubmitted(true);
        }}
        userId={user?.uid}
        location={alert.location}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  alertHeaderInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  alertTimestamp: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  alertBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  alertDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionsContainer: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emergencyButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginTop: 4,
  },
});

export default AlertDetailsScreen;
