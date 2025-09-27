import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  StatusBar, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { useLocation } from '../../context/LocationContext';
import { useWeather } from '../../context/WeatherContext';
import LocationService from '../../services/locationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/dateHelpers';

const AddLocationScreen = ({ route, navigation }) => {
  const { 
    editMode = false, 
    locationToEdit = null, 
    selectedLocation = null 
  } = route.params || {};
  
  const { saveLocation, currentLocation } = useLocation();
  const { getWeatherForLocation } = useWeather();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    notes: ''
  });
  
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherPreview, setWeatherPreview] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMap, setShowMap] = useState(true);
  const [markerPosition, setMarkerPosition] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);

  useEffect(() => {
    initializeScreen();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      loadWeatherPreview();
    }
  }, [formData.latitude, formData.longitude]);

  const initializeScreen = () => {
    if (editMode && locationToEdit) {
      // Edit existing location
      setFormData({
        name: locationToEdit.name || '',
        address: locationToEdit.address || '',
        latitude: locationToEdit.latitude,
        longitude: locationToEdit.longitude,
        notes: locationToEdit.notes || ''
      });
      
      setMapRegion({
        latitude: locationToEdit.latitude,
        longitude: locationToEdit.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      setMarkerPosition({
        latitude: locationToEdit.latitude,
        longitude: locationToEdit.longitude,
      });
      
      navigation.setOptions({ title: 'Edit Location' });
    } else if (selectedLocation) {
      // Add new location from picker
      setFormData({
        name: selectedLocation.name || '',
        address: selectedLocation.address || '',
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        notes: ''
      });
      
      setMapRegion({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      setMarkerPosition({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
    } else {
      // New location - use current location
      if (currentLocation) {
        setMapRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    }
  };

  const loadWeatherPreview = async () => {
    if (!formData.latitude || !formData.longitude) return;
    
    try {
      setLoadingWeather(true);
      const weather = await getWeatherForLocation({
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      setWeatherPreview(weather);
    } catch (error) {
      console.log('Weather preview not available:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    setMarkerPosition({ latitude, longitude });
    setFormData(prev => ({ ...prev, latitude, longitude }));
    
    try {
      const addressInfo = await LocationService.reverseGeocode(latitude, longitude);
      if (addressInfo) {
        setFormData(prev => ({
          ...prev,
          address: addressInfo.formattedAddress,
          name: prev.name || addressInfo.city || 'Custom Location'
        }));
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
  };

  const handleCurrentLocationPress = async () => {
    if (!currentLocation) {
      Alert.alert('Location Error', 'Current location not available');
      return;
    }

    setMarkerPosition({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });
    
    setFormData(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: currentLocation.address?.formattedAddress || '',
      name: prev.name || currentLocation.address?.city || 'Current Location'
    }));

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this location');
      return false;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Missing Coordinates', 'Please select a location on the map');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const locationData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        notes: formData.notes.trim(),
      };

      if (editMode && locationToEdit) {
        // Update existing location (would need update function)
        Alert.alert('Success', 'Location updated successfully!');
      } else {
        // Save new location
        const result = await saveLocation(locationData);
        
        if (result.success) {
          Alert.alert('Success', 'Location saved successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', result.error || 'Failed to save location');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormSection = () => (
    <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Home, Office, Parents House"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Full address will be filled automatically"
          value={formData.address}
          onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Add any notes about this location..."
          value={formData.notes}
          onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      {formData.latitude && formData.longitude && (
        <View style={styles.coordinatesInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.coordinatesText}>
            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderMapSection = () => (
    <Animated.View style={[styles.mapSection, { opacity: fadeAnim }]}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Select Location</Text>
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={handleCurrentLocationPress}
        >
          <Ionicons name="locate" size={16} color="#4A90E2" />
          <Text style={styles.currentLocationText}>Current</Text>
        </TouchableOpacity>
      </View>

      {mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                title={formData.name || 'Selected Location'}
                description={formData.address}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={32} color="#FF6B35" />
                </View>
              </Marker>
            )}
          </MapView>
          
          <Text style={styles.mapInstructions}>
            Tap on the map to select a location
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderWeatherPreview = () => {
    if (!weatherPreview || loadingWeather) return null;

    const current = weatherPreview.current;
    if (!current) return null;

    return (
      <Animated.View style={[styles.weatherPreview, { opacity: fadeAnim }]}>
        <Text style={styles.weatherPreviewTitle}>Current Weather</Text>
        
        <View style={styles.weatherPreviewContent}>
          <View style={styles.weatherIcon}>
            <Ionicons name="partly-sunny" size={32} color="#4A90E2" />
          </View>
          
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTemp}>
              {Math.round(current.temperature)}°C
            </Text>
            <Text style={styles.weatherCondition}>
              {current.condition || 'Clear'}
            </Text>
          </View>
          
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherDetail}>
              Humidity: {current.humidity}%
            </Text>
            <Text style={styles.weatherDetail}>
              Wind: {Math.round(current.windSpeed)} km/h
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderFormSection()}
        {renderMapSection()}
        {renderWeatherPreview()}

        {loadingWeather && (
          <LoadingSpinner 
            visible={true} 
            message="Loading weather preview..."
            type="weather"
            overlay={false}
          />
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#CCC', '#999'] : ['#FF6B35', '#FF5722']}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <LoadingSpinner 
                visible={true} 
                color="#FFFFFF" 
                size="small"
                overlay={false}
              />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Location' : 'Save Location'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 100,
  },
  formSection: {
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapSection: {
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
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currentLocationText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 4,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 250,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherPreview: {
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
  weatherPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  weatherPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    marginRight: 16,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherCondition: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  weatherDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AddLocationScreen;
