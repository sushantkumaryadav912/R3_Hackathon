export const WeatherIcons = {
  // Weather condition mappings to Ionicons
  clear: 'sunny',
  'clear-day': 'sunny',
  'clear-night': 'moon',
  cloudy: 'cloudy',
  'partly-cloudy': 'partly-sunny',
  'partly-cloudy-day': 'partly-sunny',
  'partly-cloudy-night': 'cloudy-night',
  rain: 'rainy',
  'light-rain': 'rainy-outline',
  'heavy-rain': 'thunderstorm',
  thunderstorm: 'thunderstorm',
  snow: 'snow',
  fog: 'cloudy',
  mist: 'cloudy-outline',
  wind: 'leaf',
  hot: 'thermometer',
  cold: 'snow-outline',
  
  // Alert types
  warning: 'warning',
  critical: 'alert-circle',
  advisory: 'information-circle',
  
  // Weather parameters
  temperature: 'thermometer-outline',
  humidity: 'water-outline',
  pressure: 'speedometer-outline',
  windSpeed: 'leaf-outline',
  visibility: 'eye-outline',
  uvIndex: 'sunny-outline',
  precipitation: 'rainy-outline',
};

export const getWeatherIcon = (condition, isDay = true) => {
  if (!condition) return 'help-circle-outline';
  
  const conditionLower = condition.toLowerCase();
  
  // Handle day/night variations
  if (conditionLower.includes('clear')) {
    return isDay ? WeatherIcons['clear-day'] : WeatherIcons['clear-night'];
  }
  
  if (conditionLower.includes('partly') || conditionLower.includes('partial')) {
    return isDay ? WeatherIcons['partly-cloudy-day'] : WeatherIcons['partly-cloudy-night'];
  }
  
  // Direct mappings
  if (WeatherIcons[conditionLower]) {
    return WeatherIcons[conditionLower];
  }
  
  // Keyword-based matching
  if (conditionLower.includes('rain')) {
    if (conditionLower.includes('heavy') || conditionLower.includes('storm')) {
      return WeatherIcons.thunderstorm;
    }
    return WeatherIcons.rain;
  }
  
  if (conditionLower.includes('cloud')) {
    return WeatherIcons.cloudy;
  }
  
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    return WeatherIcons.thunderstorm;
  }
  
  if (conditionLower.includes('snow')) {
    return WeatherIcons.snow;
  }
  
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return WeatherIcons.fog;
  }
  
  if (conditionLower.includes('wind')) {
    return WeatherIcons.wind;
  }
  
  // Default fallback
  return 'partly-sunny-outline';
};

export const getAlertIcon = (alertType, severity = 'standard') => {
  if (severity === 'critical') {
    return 'alert-circle';
  }
  
  if (severity === 'warning') {
    return 'warning';
  }
  
  return 'information-circle-outline';
};

export const getParameterIcon = (parameter) => {
  const parameterLower = parameter.toLowerCase();
  
  if (WeatherIcons[parameterLower]) {
    return WeatherIcons[parameterLower];
  }
  
  return 'help-circle-outline';
};

export const WeatherConditions = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  PARTLY_CLOUDY: 'partly-cloudy',
  RAIN: 'rain',
  THUNDERSTORM: 'thunderstorm',
  SNOW: 'snow',
  FOG: 'fog',
  MIST: 'mist',
  WIND: 'wind',
};

export const AlertSeverity = {
  ADVISORY: 'advisory',
  WARNING: 'warning',
  CRITICAL: 'critical',
};
