import React, { createContext, useContext, useState, useEffect } from 'react';
import WeatherAPI from '../services/weatherAPI';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WeatherContext = createContext();

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export const WeatherProvider = ({ children }) => {
  const { currentLocation } = useLocation();
  const { user } = useAuth();
  
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Auto-refresh weather data when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchWeatherData(currentLocation);
    }
  }, [currentLocation]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentLocation && !loading) {
        fetchWeatherData(currentLocation, true); // Silent refresh
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [currentLocation, loading]);

  const fetchWeatherData = async (location, silent = false) => {
    if (!location || !location.latitude || !location.longitude) {
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      const [weatherData, forecastData, alertsData] = await Promise.all([
        WeatherAPI.getCurrentWeather(location.latitude, location.longitude),
        WeatherAPI.getForecast(location.latitude, location.longitude),
        WeatherAPI.getAlerts(location.latitude, location.longitude),
      ]);

      setCurrentWeather(weatherData);
      setForecast(forecastData);
      setAlerts(alertsData);
      setLastUpdated(new Date());

      // Cache the data
      const cacheData = {
        currentWeather: weatherData,
        forecast: forecastData,
        alerts: alertsData,
        location: location,
        timestamp: new Date(),
      };
      
      await AsyncStorage.setItem('weatherCache', JSON.stringify(cacheData));

    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError(error.message);
      
      // Try to load cached data
      await loadCachedWeatherData();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadCachedWeatherData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('weatherCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = new Date() - new Date(parsed.timestamp);
        
        // Use cached data if less than 30 minutes old
        if (cacheAge < 30 * 60 * 1000) {
          setCurrentWeather(parsed.currentWeather);
          setForecast(parsed.forecast);
          setAlerts(parsed.alerts);
          setLastUpdated(new Date(parsed.timestamp));
        }
      }
    } catch (error) {
      console.error('Error loading cached weather data:', error);
    }
  };

  const getAIForecast = async (location) => {
    try {
      if (!location) location = currentLocation;
      if (!location) throw new Error('No location available');

      const aiForecast = await WeatherAPI.getAIForecast(
        location.latitude, 
        location.longitude
      );
      
      return aiForecast;
    } catch (error) {
      console.error('Error getting AI forecast:', error);
      throw error;
    }
  };

  const getHistoricalData = async (location, startDate, endDate) => {
    try {
      if (!location) location = currentLocation;
      if (!location) throw new Error('No location available');

      const historicalData = await WeatherAPI.getHistoricalData(
        location.latitude,
        location.longitude,
        startDate,
        endDate
      );
      
      return historicalData;
    } catch (error) {
      console.error('Error getting historical data:', error);
      throw error;
    }
  };

  const refreshWeatherData = async () => {
    if (currentLocation) {
      await fetchWeatherData(currentLocation);
    }
  };

  const getWeatherForLocation = async (location) => {
    try {
      setLoading(true);
      
      const [weatherData, forecastData] = await Promise.all([
        WeatherAPI.getCurrentWeather(location.latitude, location.longitude),
        WeatherAPI.getForecast(location.latitude, location.longitude),
      ]);

      return {
        current: weatherData,
        forecast: forecastData,
      };
    } catch (error) {
      console.error('Error getting weather for location:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isDataStale = () => {
    if (!lastUpdated) return true;
    
    const staleThreshold = 15 * 60 * 1000; // 15 minutes
    return (new Date() - lastUpdated) > staleThreshold;
  };

  const getWeatherTrend = () => {
    if (!forecast || !forecast.hourly || forecast.hourly.length < 6) {
      return 'stable';
    }

    const temperatures = forecast.hourly.slice(0, 6).map(h => h.temperature);
    const increasing = temperatures.filter((temp, i) => i > 0 && temp > temperatures[i - 1]).length;
    const decreasing = temperatures.filter((temp, i) => i > 0 && temp < temperatures[i - 1]).length;

    if (increasing > decreasing) return 'warming';
    if (decreasing > increasing) return 'cooling';
    return 'stable';
  };

  const getActiveAlerts = () => {
    if (!alerts) return [];
    
    return alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp);
      const now = new Date();
      const ageInHours = (now - alertTime) / (1000 * 60 * 60);
      
      // Filter out alerts older than 24 hours
      return ageInHours < 24;
    });
  };

  const value = {
    currentWeather,
    forecast,
    alerts: getActiveAlerts(),
    loading,
    error,
    lastUpdated,
    isDataStale: isDataStale(),
    weatherTrend: getWeatherTrend(),
    fetchWeatherData,
    refreshWeatherData,
    getWeatherForLocation,
    getAIForecast,
    getHistoricalData,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};
