import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getWeatherIcon } from '../utils/weatherIcons';
import { formatDate, getTimeOfDay, isDaytime } from '../utils/dateHelpers';

const WeatherCard = ({ weather, forecast, location, onPress }) => {
  if (!weather) return null;

  const currentTime = new Date();
  const isDay = isDaytime(currentTime);
  const timeOfDay = getTimeOfDay(currentTime);

  const getGradientColors = () => {
    if (!isDay) return ['#1a1a2e', '#16213e', '#0f3460'];
    
    switch (timeOfDay) {
      case 'morning':
        return ['#ff9a9e', '#fecfef', '#fecfef'];
      case 'afternoon':
        return ['#a8edea', '#fed6e3', '#fed6e3'];
      case 'evening':
        return ['#d299c2', '#fef9d7', '#fef9d7'];
      default:
        return ['#667eea', '#764ba2', '#764ba2'];
    }
  };

  const formatTemperature = (temp) => {
    return Math.round(temp);
  };

  const getFeelsLikeText = () => {
    const temp = weather.temperature;
    const feelsLike = weather.feelsLike;
    const diff = Math.abs(temp - feelsLike);
    
    if (diff < 2) return 'Feels the same';
    if (feelsLike > temp) return `Feels ${Math.round(diff)}° warmer`;
    return `Feels ${Math.round(diff)}° cooler`;
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with location */}
        <View style={styles.header}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color="#FFFFFF" />
            <Text style={styles.locationText}>
              {location?.address?.city || 'Current Location'}
            </Text>
          </View>
          <Text style={styles.timeText}>
            {formatDate(currentTime, 'time')}
          </Text>
        </View>

        {/* Main weather display */}
        <View style={styles.mainWeather}>
          <View style={styles.weatherIcon}>
            <Ionicons 
              name={getWeatherIcon(weather.condition, isDay)} 
              size={80} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.temperatureSection}>
            <Text style={styles.temperature}>
              {formatTemperature(weather.temperature)}°
            </Text>
            <Text style={styles.condition}>
              {weather.condition || 'Clear'}
            </Text>
            <Text style={styles.feelsLike}>
              {getFeelsLikeText()}
            </Text>
          </View>
        </View>

        {/* Weather details grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={20} color="#FFFFFF" />
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{weather.humidity}%</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.windSpeed)} km/h
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailValue}>
              {weather.visibility ? `${weather.visibility} km` : 'Good'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={20} color="#FFFFFF" />
            <Text style={styles.detailLabel}>Pressure</Text>
            <Text style={styles.detailValue}>
              {weather.pressure ? `${Math.round(weather.pressure)} hPa` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Hourly forecast preview */}
        {forecast?.hourly && (
          <View style={styles.hourlySection}>
            <Text style={styles.sectionTitle}>Today</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.hourlyScroll}
            >
              {forecast.hourly.slice(0, 8).map((hour, index) => (
                <View key={index} style={styles.hourlyItem}>
                  <Text style={styles.hourlyTime}>
                    {formatDate(new Date(hour.timestamp), 'time').slice(0, -3)}
                  </Text>
                  <Ionicons 
                    name={getWeatherIcon(hour.condition, isDaytime(new Date(hour.timestamp)))} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.hourlyTemp}>
                    {formatTemperature(hour.temperature)}°
                  </Text>
                  {hour.precipitation > 0 && (
                    <View style={styles.precipitationInfo}>
                      <Ionicons name="rainy" size={12} color="#87CEEB" />
                      <Text style={styles.precipitationText}>
                        {Math.round(hour.precipitation)}%
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily forecast preview */}
        {forecast?.daily && (
          <View style={styles.dailySection}>
            <Text style={styles.sectionTitle}>7-Day Forecast</Text>
            {forecast.daily.slice(0, 3).map((day, index) => (
              <View key={index} style={styles.dailyItem}>
                <Text style={styles.dayName}>
                  {index === 0 ? 'Today' : formatDate(new Date(day.date), 'short')}
                </Text>
                <View style={styles.dailyWeather}>
                  <Ionicons 
                    name={getWeatherIcon(day.condition)} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.dailyCondition}>{day.condition}</Text>
                </View>
                <View style={styles.dailyTemp}>
                  <Text style={styles.dailyHigh}>{formatTemperature(day.high)}°</Text>
                  <Text style={styles.dailyLow}>{formatTemperature(day.low)}°</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  weatherIcon: {
    marginRight: 20,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '300',
    lineHeight: 64,
  },
  condition: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  feelsLike: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  detailItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  hourlySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  hourlyScroll: {
    flexGrow: 0,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
  },
  hourlyTime: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 8,
  },
  hourlyTemp: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  precipitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  precipitationText: {
    color: '#87CEEB',
    fontSize: 10,
    marginLeft: 2,
  },
  dailySection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dailyWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  dailyCondition: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  dailyTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dailyHigh: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dailyLow: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.6,
    marginLeft: 8,
  },
});

export default WeatherCard;
