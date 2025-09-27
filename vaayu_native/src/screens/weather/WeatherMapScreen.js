import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle, Heatmap } from 'react-native-maps';
import { useWeather } from '../../context/WeatherContext';
import { useLocation } from '../../context/LocationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getWeatherIcon } from '../../utils/weatherIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WeatherMapScreen = ({ navigation }) => {
  const { currentWeather, alerts } = useWeather();
  const { currentLocation, savedLocations } = useLocation();
  
  const [mapType, setMapType] = useState('standard');
  const [showAlerts, setShowAlerts] = useState(true);
  const [showSavedLocations, setShowSavedLocations] = useState(true);
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef(null);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Focus map on current location
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  }, [currentLocation]);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      // Simulate weather data points for Maharashtra
      const mockWeatherData = [
        {
          id: '1',
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          temperature: 28,
          condition: 'cloudy',
          rainfall: 0.5,
        },
        {
          id: '2',
          latitude: 18.5204,
          longitude: 73.8567,
          city: 'Pune',
          temperature: 25,
          condition: 'partly-cloudy',
          rainfall: 0.2,
        },
        {
          id: '3',
          latitude: 21.1458,
          longitude: 79.0882,
          city: 'Nagpur',
          temperature: 32,
          condition: 'sunny',
          rainfall: 0,
        },
        {
          id: '4',
          latitude: 19.9975,
          longitude: 73.7898,
          city: 'Nashik',
          temperature: 27,
          condition: 'rainy',
          rainfall: 2.1,
        },
        {
          id: '5',
          latitude: 17.6599,
          longitude: 75.9064,
          city: 'Solapur',
          temperature: 30,
          condition: 'clear',
          rainfall: 0,
        },
      ];
      
      setWeatherData(mockWeatherData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load weather data for map');
    } finally {
      setLoading(false);
    }
  };

  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  const focusOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    }
  };

  const renderWeatherMarkers = () => {
    return weatherData.map((location) => (
      <Marker
        key={location.id}
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        title={location.city}
        description={`${location.temperature}°C • ${location.condition}`}
      >
        <View style={styles.weatherMarker}>
          <View style={[styles.weatherMarkerIcon, { backgroundColor: getTemperatureColor(location.temperature) }]}>
            <Ionicons 
              name={getWeatherIcon(location.condition)} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.weatherMarkerTemp}>{location.temperature}°</Text>
        </View>
      </Marker>
    ));
  };

  const renderAlertMarkers = () => {
    if (!showAlerts || !alerts) return null;

    return alerts.map((alert, index) => (
      <Marker
        key={`alert-${index}`}
        coordinate={{
          latitude: alert.location?.latitude || currentLocation?.latitude || 19.0760,
          longitude: alert.location?.longitude || currentLocation?.longitude || 72.8777,
        }}
        title={alert.title}
        description={alert.message}
        onPress={() => navigation.navigate('AlertDetails', { alert })}
      >
        <View style={styles.alertMarker}>
          <Ionicons name="warning" size={24} color="#FF4444" />
        </View>
      </Marker>
    ));
  };

  const renderSavedLocationMarkers = () => {
    if (!showSavedLocations) return null;

    return savedLocations.map((location) => (
      <Marker
        key={location.id}
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        title={location.name}
        description={location.address}
      >
        <View style={styles.savedLocationMarker}>
          <Ionicons name="bookmark" size={20} color="#4A90E2" />
        </View>
      </Marker>
    ));
  };

  const renderRainfallHeatmap = () => {
    const rainfallData = weatherData
      .filter(location => location.rainfall > 0)
      .map(location => ({
        latitude: location.latitude,
        longitude: location.longitude,
        weight: location.rainfall,
      }));

    if (rainfallData.length === 0) return null;

    return (
      <Heatmap
        points={rainfallData}
        radius={50}
        opacity={0.6}
        gradient={{
          colors: ['rgba(102, 255, 0, 0)', 'rgba(147, 255, 0, 1)', 'rgba(213, 255, 0, 1)', 'rgba(255, 204, 0, 1)', 'rgba(255, 102, 0, 1)', 'rgba(255, 0, 0, 1)'],
          startPoints: [0.01, 0.04, 0.1, 0.45, 0.50, 0.90],
          colorMapSize: 2000
        }}
      />
    );
  };

  const getTemperatureColor = (temp) => {
    if (temp < 15) return '#4A90E2'; // Cold - Blue
    if (temp < 25) return '#4CAF50'; // Cool - Green
    if (temp < 35) return '#FFA500'; // Warm - Orange
    return '#FF4444'; // Hot - Red
  };

  const renderMapControls = () => (
    <View style={styles.mapControls}>
      {/* Map Type Toggle */}
      <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
        <Ionicons name="layers" size={20} color="#333" />
        <Text style={styles.controlButtonText}>
          {mapType === 'standard' ? 'Map' : mapType === 'satellite' ? 'Sat' : 'Hyb'}
        </Text>
      </TouchableOpacity>

      {/* Current Location */}
      <TouchableOpacity style={styles.controlButton} onPress={focusOnCurrentLocation}>
        <Ionicons name="locate" size={20} color="#4A90E2" />
      </TouchableOpacity>

      {/* Toggle Alerts */}
      <TouchableOpacity 
        style={[styles.controlButton, !showAlerts && styles.controlButtonInactive]} 
        onPress={() => setShowAlerts(!showAlerts)}
      >
        <Ionicons 
          name="warning" 
          size={20} 
          color={showAlerts ? "#FF4444" : "#CCC"} 
        />
      </TouchableOpacity>

      {/* Toggle Saved Locations */}
      <TouchableOpacity 
        style={[styles.controlButton, !showSavedLocations && styles.controlButtonInactive]} 
        onPress={() => setShowSavedLocations(!showSavedLocations)}
      >
        <Ionicons 
          name="bookmark" 
          size={20} 
          color={showSavedLocations ? "#4A90E2" : "#CCC"} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legend}>
      <Text style={styles.legendTitle}>Weather Map</Text>
      
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#4A90E2' }]} />
        <Text style={styles.legendText}>Cold (&lt;15°C)</Text>
      </View>
      
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
        <Text style={styles.legendText}>Cool (15-25°C)</Text>
      </View>
      
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#FFA500' }]} />
        <Text style={styles.legendText}>Warm (25-35°C)</Text>
      </View>
      
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#FF4444' }]} />
        <Text style={styles.legendText}>Hot (&gt;35°C)</Text>
      </View>
    </View>
  );

  if (!currentLocation) {
    return (
      <LoadingSpinner 
        visible={true} 
        message="Getting your location..." 
        type="location"
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={currentLocation.address?.formattedAddress}
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="location" size={24} color="#4A90E2" />
            </View>
          </Marker>
        )}

        {/* Weather Data Markers */}
        {renderWeatherMarkers()}

        {/* Alert Markers */}
        {renderAlertMarkers()}

        {/* Saved Location Markers */}
        {renderSavedLocationMarkers()}

        {/* Rainfall Heatmap */}
        {renderRainfallHeatmap()}

        {/* Alert Coverage Areas */}
        {showAlerts && alerts.map((alert, index) => (
          alert.location && (
            <Circle
              key={`circle-${index}`}
              center={{
                latitude: alert.location.latitude || currentLocation.latitude,
                longitude: alert.location.longitude || currentLocation.longitude,
              }}
              radius={alert.radius || 10000} // 10km default
              fillColor="rgba(255, 68, 68, 0.2)"
              strokeColor="rgba(255, 68, 68, 0.5)"
              strokeWidth={2}
            />
          )
        ))}
      </MapView>

      {/* Map Controls */}
      {renderMapControls()}

      {/* Legend */}
      {renderLegend()}

      {/* Loading Overlay */}
      {loading && (
        <LoadingSpinner 
          visible={true} 
          message="Loading weather data..." 
          type="sync"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 48,
    minHeight: 48,
  },
  controlButtonInactive: {
    backgroundColor: '#F0F0F0',
  },
  controlButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  // Marker Styles
  weatherMarker: {
    alignItems: 'center',
  },
  weatherMarkerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  weatherMarkerTemp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,68,68,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  currentLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74,144,226,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  savedLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74,144,226,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default WeatherMapScreen;
