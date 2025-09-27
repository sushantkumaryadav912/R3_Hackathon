import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, StatusBar, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../../context/LocationContext';
import { useWeather } from '../../context/WeatherContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import LocationPicker from '../../components/LocationPicker';
import { formatDate } from '../../utils/dateHelpers';
import { getWeatherIcon } from '../../utils/weatherIcons';

const SavedLocationsScreen = ({ navigation }) => {
  const { 
    savedLocations, 
    currentLocation, 
    deleteLocation, 
    setCurrentLocation 
  } = useLocation();
  const { getWeatherForLocation } = useWeather();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState({});
  const [locationWeather, setLocationWeather] = useState({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    loadWeatherForAllLocations();
  }, [savedLocations]);

  const loadWeatherForAllLocations = async () => {
    const weatherPromises = savedLocations.map(async (location) => {
      try {
        setLoadingWeather(prev => ({ ...prev, [location.id]: true }));
        const weather = await getWeatherForLocation(location);
        setLocationWeather(prev => ({ ...prev, [location.id]: weather }));
      } catch (error) {
        console.error(`Error loading weather for ${location.name}:`, error);
      } finally {
        setLoadingWeather(prev => ({ ...prev, [location.id]: false }));
      }
    });

    await Promise.all(weatherPromises);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWeatherForAllLocations();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh weather data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationPress = (location) => {
    setSelectedLocation(location);
    Alert.alert(
      location.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set as Current', 
          onPress: () => setAsCurrentLocation(location) 
        },
        { 
          text: 'View Weather', 
          onPress: () => viewLocationWeather(location) 
        },
        { 
          text: 'Edit', 
          onPress: () => editLocation(location) 
        },
        { 
          text: 'Delete', 
          onPress: () => confirmDeleteLocation(location),
          style: 'destructive'
        }
      ]
    );
  };

  const setAsCurrentLocation = (location) => {
    setCurrentLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: { 
        formattedAddress: location.address,
        city: location.name 
      },
      timestamp: new Date(),
    });
    
    Alert.alert('Success', `Current location set to ${location.name}`);
  };

  const viewLocationWeather = (location) => {
    // Navigate to weather details for this location
    navigation.navigate('Weather', {
      screen: 'WeatherHome',
      params: { selectedLocation: location }
    });
  };

  const editLocation = (location) => {
    navigation.navigate('AddLocation', { 
      editMode: true, 
      locationToEdit: location 
    });
  };

  const confirmDeleteLocation = (location) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to remove "${location.name}" from your saved locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => handleDeleteLocation(location),
          style: 'destructive'
        }
      ]
    );
  };

  const handleDeleteLocation = async (location) => {
    try {
      const result = await deleteLocation(location.id);
      if (result.success) {
        // Remove from local weather data
        setLocationWeather(prev => {
          const newWeather = { ...prev };
          delete newWeather[location.id];
          return newWeather;
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to delete location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete location');
    }
  };

  const handleAddLocation = () => {
    setShowLocationPicker(true);
  };

  const handleLocationSelected = (location) => {
    navigation.navigate('AddLocation', { selectedLocation: location });
  };

  const renderLocationCard = ({ item: location }) => {
    const weather = locationWeather[location.id];
    const isLoading = loadingWeather[location.id];

    return (
      <TouchableOpacity
        style={styles.locationCard}
        onPress={() => handleLocationPress(location)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          style={styles.locationCardGradient}
        >
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color="#FF6B35" />
            </View>
            
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationDistance}>
                {location.distance ? `${location.distance.toFixed(1)} km away` : 'Distance unknown'}
              </Text>
            </View>

            <View style={styles.locationWeather}>
              {isLoading ? (
                <LoadingSpinner 
                  visible={true} 
                  size="small" 
                  overlay={false}
                  color="#FF6B35"
                />
              ) : weather?.current ? (
                <>
                  <View style={styles.weatherIcon}>
                    <Ionicons 
                      name={getWeatherIcon(weather.current.condition)} 
                      size={28} 
                      color="#4A90E2" 
                    />
                  </View>
                  <Text style={styles.weatherTemp}>
                    {Math.round(weather.current.temperature)}°
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {weather.current.condition}
                  </Text>
                </>
              ) : (
                <Text style={styles.weatherUnavailable}>Weather unavailable</Text>
              )}
            </View>
          </View>

          {/* Weather details row */}
          {weather?.current && (
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="water-outline" size={16} color="#4A90E2" />
                <Text style={styles.weatherDetailText}>
                  {weather.current.humidity}%
                </Text>
              </View>
              
              <View style={styles.weatherDetailItem}>
                <Ionicons name="leaf-outline" size={16} color="#4CAF50" />
                <Text style={styles.weatherDetailText}>
                  {Math.round(weather.current.windSpeed)} km/h
                </Text>
              </View>
              
              {weather.current.precipitation > 0 && (
                <View style={styles.weatherDetailItem}>
                  <Ionicons name="rainy-outline" size={16} color="#87CEEB" />
                  <Text style={styles.weatherDetailText}>
                    {Math.round(weather.current.precipitation)}%
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.locationActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setAsCurrentLocation(location)}
            >
              <Ionicons name="navigate-circle-outline" size={16} color="#4A90E2" />
              <Text style={styles.actionButtonText}>Set Current</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => viewLocationWeather(location)}
            >
              <Ionicons name="partly-sunny-outline" size={16} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Weather</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => editLocation(location)}
            >
              <Ionicons name="create-outline" size={16} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#FF6B35', '#FF5722']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Locations</Text>
            <Text style={styles.headerSubtitle}>
              {savedLocations.length} saved location{savedLocations.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddLocation}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Current Location Display */}
        {currentLocation && (
          <View style={styles.currentLocationDisplay}>
            <View style={styles.currentLocationIcon}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.currentLocationText}>
              <Text style={styles.currentLocationLabel}>Current Location</Text>
              <Text style={styles.currentLocationName}>
                {currentLocation.address?.city || 'Getting location...'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={64} color="#CCC" />
      </View>
      <Text style={styles.emptyTitle}>No Saved Locations</Text>
      <Text style={styles.emptySubtitle}>
        Add locations to quickly check weather conditions in your favorite places
      </Text>
      <TouchableOpacity 
        style={styles.emptyActionButton}
        onPress={handleAddLocation}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF5722']}
          style={styles.emptyActionGradient}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyActionText}>Add Your First Location</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={styles.quickActionCard}
        onPress={() => navigation.navigate('Weather')}
      >
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.quickActionGradient}
        >
          <Ionicons name="partly-sunny" size={32} color="#FFFFFF" />
          <Text style={styles.quickActionTitle}>Current Weather</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionCard}
        onPress={() => setShowLocationPicker(true)}
      >
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.quickActionGradient}
        >
          <Ionicons name="search" size={32} color="#FFFFFF" />
          <Text style={styles.quickActionTitle}>Find Location</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      <FlatList
        data={savedLocations}
        renderItem={renderLocationCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
        ListHeaderComponent={
          <>
            {renderHeader()}
            {savedLocations.length > 0 && renderQuickActions()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          savedLocations.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelected}
        title="Add New Location"
        showCurrentLocation={true}
        showSavedLocations={false}
        allowSearch={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  currentLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  currentLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  currentLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
  },
  locationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationCardGradient: {
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  locationDistance: {
    fontSize: 12,
    color: '#999',
  },
  locationWeather: {
    alignItems: 'center',
    minWidth: 80,
  },
  weatherIcon: {
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  weatherCondition: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  weatherUnavailable: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherDetailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default SavedLocationsScreen;
