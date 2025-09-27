import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import LocationService from '../services/locationService';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedLocations();
    }
  }, [user]);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      
      // Check for cached location first
      const cachedLocation = await AsyncStorage.getItem('lastKnownLocation');
      if (cachedLocation) {
        setCurrentLocation(JSON.parse(cachedLocation));
      }

      // Request permissions
      const permissionResult = await LocationService.requestPermissions();
      setLocationPermission(permissionResult.granted);

      if (permissionResult.granted) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await LocationService.getCurrentLocation();
      
      // Get address information
      const address = await LocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      const locationWithAddress = {
        ...location,
        address,
        timestamp: new Date(),
      };

      setCurrentLocation(locationWithAddress);
      
      // Cache the location
      await AsyncStorage.setItem('currentLocation', JSON.stringify(locationWithAddress));
      
      return locationWithAddress;
    } catch (error) {
      console.error('Error getting current location:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startWatchingLocation = () => {
    if (isWatching) return;

    try {
      setIsWatching(true);
      
      LocationService.startWatchingLocation((location) => {
        const locationUpdate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp),
        };
        
        setCurrentLocation(prev => ({
          ...prev,
          ...locationUpdate,
        }));

        // Cache updated location
        AsyncStorage.setItem('currentLocation', JSON.stringify(locationUpdate));
      });
    } catch (error) {
      console.error('Error starting location watch:', error);
      setError(error.message);
      setIsWatching(false);
    }
  };

  const stopWatchingLocation = () => {
    if (!isWatching) return;

    LocationService.stopWatchingLocation();
    setIsWatching(false);
  };

  const loadSavedLocations = () => {
    if (!user) return;

    const q = query(
      collection(db, 'saved_locations'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations = [];
      snapshot.forEach((doc) => {
        locations.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setSavedLocations(locations);
    });

    return unsubscribe;
  };

  const saveLocation = async (locationData) => {
    if (!user) {
      throw new Error('User must be logged in to save locations');
    }

    try {
      const locationToSave = {
        ...locationData,
        userId: user.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'saved_locations'), locationToSave);
      
      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error saving location:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      await deleteDoc(doc(db, 'saved_locations', locationId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting location:', error);
      return { success: false, error: error.message };
    }
  };

  const searchLocation = async (query) => {
    try {
      // This would integrate with a geocoding service
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error searching location:', error);
      return [];
    }
  };

  const getLocationWeather = async (location) => {
    try {
      // This would fetch weather for a specific location
      // Implementation depends on weather service integration
      return null;
    } catch (error) {
      console.error('Error getting location weather:', error);
      return null;
    }
  };

  const value = {
    currentLocation,
    savedLocations,
    locationPermission,
    isWatching,
    loading,
    error,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    saveLocation,
    deleteLocation,
    searchLocation,
    getLocationWeather,
    setCurrentLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
