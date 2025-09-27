import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Animated, Dimensions, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../../context/WeatherContext';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import WeatherCard from '../../components/WeatherCard';
import AlertBanner from '../../components/AlertBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import FeedbackModal from '../../components/FeedbackModal';
import { formatDate, getTimeOfDay } from '../../utils/dateHelpers';
import { getWeatherIcon } from '../../utils/weatherIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WeatherHomeScreen = ({ navigation }) => {
  const { 
    currentWeather, 
    forecast, 
    alerts, 
    loading, 
    error, 
    lastUpdated, 
    isDataStale, 
    refreshWeatherData,
    getAIForecast 
  } = useWeather();
  
  const { currentLocation, locationPermission } = useLocation();
  const { pendingFeedback } = useNotification();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPendingFeedback();
  }, [pendingFeedback]);

  useEffect(() => {
    if (currentWeather && currentLocation) {
      loadAIInsights();
    }
  }, [currentWeather, currentLocation]);

  const checkPendingFeedback = () => {
    if (pendingFeedback.length > 0) {
      const feedback = pendingFeedback[0];
      setActiveFeedback(feedback);
      setShowFeedbackModal(true);
    }
  };

  const loadAIInsights = async () => {
    if (!currentLocation || loadingAI) return;

    try {
      setLoadingAI(true);
      const aiData = await getAIForecast(currentLocation);
      setAiInsights(aiData);
    } catch (error) {
      console.log('AI insights not available:', error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWeatherData();
      await loadAIInsights();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh weather data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAlertPress = (alert) => {
    navigation.navigate('AlertDetails', { alert });
  };

  const handleWeatherCardPress = () => {
    if (forecast) {
      navigation.navigate('WeatherMap');
    }
  };

  const getBackgroundGradient = () => {
    if (!currentWeather) return ['#4A90E2', '#357ABD'];

    const timeOfDay = getTimeOfDay();
    const condition = currentWeather.condition?.toLowerCase() || '';

    if (timeOfDay === 'night') {
      return ['#1a1a2e', '#16213e', '#0f3460'];
    }

    if (condition.includes('rain') || condition.includes('storm')) {
      return ['#4B79A1', '#283E51'];
    }

    if (condition.includes('cloud')) {
      return ['#bdc3c7', '#2c3e50'];
    }

    if (condition.includes('clear') || condition.includes('sunny')) {
      return ['#74b9ff', '#0984e3'];
    }

    return ['#4A90E2', '#357ABD'];
  };

  if (locationPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={['#FF6B6B', '#FF5252']} style={styles.errorGradient}>
          <Ionicons name="location-outline" size={64} color="#FFFFFF" />
          <Text style={styles.errorTitle}>Location Access Required</Text>
          <Text style={styles.errorMessage}>
            Vaayu needs location access to provide accurate weather alerts for your area.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => {}}>
            <Text style={styles.errorButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (loading && !currentWeather) {
    return (
      <LoadingSpinner 
        visible={true} 
        message="Getting weather data for your location..."
        type="weather"
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={getBackgroundGradient()}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[
          styles.header,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0.8],
              extrapolate: 'clamp',
            }),
          }
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>
                {currentLocation?.address?.city || 'Getting location...'}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={loadAIInsights}
                disabled={loadingAI}
              >
                <Ionicons 
                  name={loadingAI ? "sync" : "analytics"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate('WeatherMap')}
              >
                <Ionicons name="map" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Updated {formatDate(lastUpdated, 'time')}
              {isDataStale && <Text style={styles.staleIndicator}> • Data may be outdated</Text>}
            </Text>
          )}
        </Animated.View>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            {alerts.slice(0, 3).map((alert, index) => (
              <AlertBanner
                key={alert.id || index}
                alert={alert}
                onPress={handleAlertPress}
                showActions={true}
              />
            ))}
            
            {alerts.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllAlerts}
                onPress={() => navigation.navigate('Alerts')}
              >
                <Text style={styles.viewAllAlertsText}>
                  View all {alerts.length} alerts
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Main Weather Card */}
        {currentWeather && (
          <WeatherCard
            weather={currentWeather}
            forecast={forecast}
            location={currentLocation}
            onPress={handleWeatherCardPress}
          />
        )}

        {/* AI Insights Section */}
        {aiInsights && (
          <View style={styles.aiInsightsSection}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.aiInsightsCard}
            >
              <View style={styles.aiInsightsHeader}>
                <View style={styles.aiInsightsIcon}>
                  <Ionicons name="bulb" size={24} color="#FF6B35" />
                </View>
                <View style={styles.aiInsightsHeaderText}>
                  <Text style={styles.aiInsightsTitle}>AI Weather Insights</Text>
                  <Text style={styles.aiInsightsSubtitle}>
                    Powered by machine learning predictions
                  </Text>
                </View>
              </View>

              {aiInsights.insights && aiInsights.insights.length > 0 && (
                <View style={styles.aiInsightsList}>
                  {aiInsights.insights.slice(0, 3).map((insight, index) => (
                    <View key={index} style={styles.aiInsightItem}>
                      <View style={styles.aiInsightDot} />
                      <Text style={styles.aiInsightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {aiInsights.confidence && (
                <View style={styles.confidenceSection}>
                  <Text style={styles.confidenceLabel}>Prediction Confidence</Text>
                  <View style={styles.confidenceBar}>
                    <View 
                      style={[
                        styles.confidenceFill,
                        { width: `${aiInsights.confidence}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.confidenceValue}>{aiInsights.confidence}%</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Locations')}
            >
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="location-outline" size={28} color="#FFFFFF" />
                <Text style={styles.quickActionTitle}>Locations</Text>
                <Text style={styles.quickActionSubtitle}>Manage saved places</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Alerts')}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF5722']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="warning-outline" size={28} color="#FFFFFF" />
                <Text style={styles.quickActionTitle}>Alerts</Text>
                <Text style={styles.quickActionSubtitle}>Safety notifications</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="settings-outline" size={28} color="#FFFFFF" />
                <Text style={styles.quickActionTitle}>Settings</Text>
                <Text style={styles.quickActionSubtitle}>Customize alerts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Details Grid */}
        {currentWeather && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Current Conditions</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Ionicons name="thermometer-outline" size={24} color="#FF6B35" />
                <Text style={styles.detailValue}>
                  {Math.round(currentWeather.feelsLike)}°
                </Text>
                <Text style={styles.detailLabel}>Feels Like</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="water-outline" size={24} color="#4A90E2" />
                <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
                <Text style={styles.detailLabel}>Humidity</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
                <Text style={styles.detailValue}>
                  {Math.round(currentWeather.windSpeed)} km/h
                </Text>
                <Text style={styles.detailLabel}>Wind Speed</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="eye-outline" size={24} color="#9C27B0" />
                <Text style={styles.detailValue}>
                  {currentWeather.visibility || 'Good'}
                </Text>
                <Text style={styles.detailLabel}>Visibility</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="speedometer-outline" size={24} color="#FF9800" />
                <Text style={styles.detailValue}>
                  {Math.round(currentWeather.pressure)} hPa
                </Text>
                <Text style={styles.detailLabel}>Pressure</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="sunny-outline" size={24} color="#FFC107" />
                <Text style={styles.detailValue}>
                  {currentWeather.uvIndex || 'N/A'}
                </Text>
                <Text style={styles.detailLabel}>UV Index</Text>
              </View>
            </View>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorMessage}>
            <Ionicons name="warning" size={24} color="#FF6B35" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        alert={activeFeedback}
        onClose={() => {
          setShowFeedbackModal(false);
          setActiveFeedback(null);
        }}
        userId={currentLocation?.userId}
        location={currentLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  staleIndicator: {
    color: '#FFA500',
  },
  alertsSection: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  viewAllAlerts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  viewAllAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginRight: 4,
  },
  aiInsightsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  aiInsightsCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiInsightsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiInsightsHeaderText: {
    flex: 1,
  },
  aiInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aiInsightsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  aiInsightsList: {
    marginBottom: 16,
  },
  aiInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  aiInsightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    marginTop: 8,
    marginRight: 12,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  confidenceSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 6,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorGradient: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    flex: 1,
    marginHorizontal: 12,
  },
  errorButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WeatherHomeScreen;
