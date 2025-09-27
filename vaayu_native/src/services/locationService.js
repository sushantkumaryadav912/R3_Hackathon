import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  constructor() {
    this.watchSubscription = null;
  }

  async requestPermissions() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Try background permission for better UX
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
          throw new Error('Location permission denied');
        }
      }
      
      return { granted: true, status };
    } catch (error) {
      console.error('Permission request failed:', error);
      return { granted: false, error: error.message };
    }
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const result = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Cache the location
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Failed to get current location:', error);
      
      // Try to return cached location
      const cached = await AsyncStorage.getItem('lastKnownLocation');
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
      const result = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude 
      });
      
      if (result && result.length > 0) {
        const location = result[0];
        return {
          city: location.city || location.subregion,
          district: location.district || location.region,
          state: location.region,
          country: location.country,
          postalCode: location.postalCode,
          formattedAddress: this.formatAddress(location),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  formatAddress(location) {
    const parts = [];
    
    if (location.name) parts.push(location.name);
    if (location.city) parts.push(location.city);
    if (location.district) parts.push(location.district);
    if (location.region) parts.push(location.region);
    
    return parts.join(', ');
  }

  startWatchingLocation(callback, options = {}) {
    const defaultOptions = {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 100, // 100 meters
    };

    this.watchSubscription = Location.watchPositionAsync(
      { ...defaultOptions, ...options },
      callback
    );

    return this.watchSubscription;
  }

  stopWatchingLocation() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }
}

export default new LocationService();
