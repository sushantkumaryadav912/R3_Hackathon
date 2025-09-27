import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAlertConfig, getAlertSeverityColor } from '../utils/alertTypes';
import { formatAlertDuration } from '../utils/alertTypes';
import { formatDate } from '../utils/dateHelpers';

const AlertBanner = ({ alert, onPress, onDismiss, showActions = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  if (!alert) return null;

  const config = getAlertConfig(alert.type);
  const severityColor = getAlertSeverityColor(alert.severity);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getAlertGradient = () => {
    switch (alert.priority || config.priority) {
      case 'critical':
      case 'emergency':
        return ['#FF4444', '#CC3333'];
      case 'warning':
        return ['#FFA500', '#FF8C00'];
      case 'advisory':
      default:
        return ['#4A90E2', '#357ABD'];
    }
  };

  const getTextColor = () => {
    return '#FFFFFF';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        onPress={() => {
          setIsExpanded(!isExpanded);
          if (onPress) onPress(alert);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getAlertGradient()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Alert Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={config.icon} 
                size={24} 
                color={getTextColor()} 
              />
            </View>
            
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: getTextColor() }]}>
                  {alert.title}
                </Text>
                {alert.severity && (
                  <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                    <Text style={styles.severityText}>
                      {alert.severity.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.timestamp, { color: getTextColor() }]}>
                {formatAlertDuration(alert)}
              </Text>
            </View>

            <View style={styles.actions}>
              {showActions && onDismiss && (
                <TouchableOpacity 
                  onPress={handleDismiss}
                  style={styles.actionButton}
                >
                  <Ionicons name="close" size={20} color={getTextColor()} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.expandButton}>
                <Ionicons 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={getTextColor()} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Alert Message */}
          <Text 
            style={[styles.message, { color: getTextColor() }]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {alert.message}
          </Text>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {alert.description && (
                <Text style={[styles.description, { color: getTextColor() }]}>
                  {alert.description}
                </Text>
              )}

              {/* Alert Details */}
              <View style={styles.detailsContainer}>
                {alert.location && (
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={getTextColor()} />
                    <Text style={[styles.detailText, { color: getTextColor() }]}>
                      {alert.location.name || 'Current Area'}
                    </Text>
                  </View>
                )}

                {alert.validUntil && (
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color={getTextColor()} />
                    <Text style={[styles.detailText, { color: getTextColor() }]}>
                      Valid until {formatDate(new Date(alert.validUntil), 'datetime')}
                    </Text>
                  </View>
                )}

                {alert.source && (
                  <View style={styles.detailItem}>
                    <Ionicons name="information-circle-outline" size={16} color={getTextColor()} />
                    <Text style={[styles.detailText, { color: getTextColor() }]}>
                      Source: {alert.source}
                    </Text>
                  </View>
                )}
              </View>

              {/* Safety Instructions */}
              {alert.instructions && alert.instructions.length > 0 && (
                <View style={styles.instructionsContainer}>
                  <Text style={[styles.instructionsTitle, { color: getTextColor() }]}>
                    Safety Instructions:
                  </Text>
                  {alert.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={[styles.instructionText, { color: getTextColor() }]}>
                        {instruction}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              {alert.actions && alert.actions.length > 0 && (
                <View style={styles.actionButtons}>
                  {alert.actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.actionButtonStyle, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                      onPress={() => action.onPress && action.onPress()}
                    >
                      {action.icon && (
                        <Ionicons name={action.icon} size={16} color={getTextColor()} />
                      )}
                      <Text style={[styles.actionButtonText, { color: getTextColor() }]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Priority Indicator */}
          <View style={[styles.priorityIndicator, { backgroundColor: config.color }]} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  gradient: {
    padding: 16,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  expandButton: {
    padding: 4,
    marginLeft: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandedContent: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.8,
  },
  instructionsContainer: {
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletPoint: {
    color: '#FFFFFF',
    marginRight: 8,
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});

export default AlertBanner;
