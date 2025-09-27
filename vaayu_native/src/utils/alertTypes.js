export const AlertTypes = {
  WEATHER_WARNING: 'weather_warning',
  SEVERE_WEATHER: 'severe_weather',
  FLOOD_WARNING: 'flood_warning',
  HEAT_WAVE: 'heat_wave',
  COLD_WAVE: 'cold_wave',
  THUNDERSTORM: 'thunderstorm',
  HEAVY_RAIN: 'heavy_rain',
  CYCLONE: 'cyclone',
  FOG_WARNING: 'fog_warning',
  AIR_QUALITY: 'air_quality',
  UV_WARNING: 'uv_warning',
  GENERAL: 'general',
};

export const AlertSeverity = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  SEVERE: 'severe',
  EXTREME: 'extreme',
};

export const AlertPriority = {
  ADVISORY: 'advisory',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

export const AlertConfig = {
  [AlertTypes.WEATHER_WARNING]: {
    color: '#FFA500',
    icon: 'warning-outline',
    priority: AlertPriority.WARNING,
    autoExpire: 6 * 60 * 60 * 1000, // 6 hours
  },
  [AlertTypes.SEVERE_WEATHER]: {
    color: '#FF4444',
    icon: 'thunderstorm-outline',
    priority: AlertPriority.CRITICAL,
    autoExpire: 3 * 60 * 60 * 1000, // 3 hours
  },
  [AlertTypes.FLOOD_WARNING]: {
    color: '#1E90FF',
    icon: 'water-outline',
    priority: AlertPriority.CRITICAL,
    autoExpire: 12 * 60 * 60 * 1000, // 12 hours
  },
  [AlertTypes.HEAT_WAVE]: {
    color: '#FF6B35',
    icon: 'thermometer-outline',
    priority: AlertPriority.WARNING,
    autoExpire: 24 * 60 * 60 * 1000, // 24 hours
  },
  [AlertTypes.COLD_WAVE]: {
    color: '#4A90E2',
    icon: 'snow-outline',
    priority: AlertPriority.WARNING,
    autoExpire: 24 * 60 * 60 * 1000, // 24 hours
  },
  [AlertTypes.THUNDERSTORM]: {
    color: '#8B00FF',
    icon: 'flash-outline',
    priority: AlertPriority.CRITICAL,
    autoExpire: 2 * 60 * 60 * 1000, // 2 hours
  },
  [AlertTypes.HEAVY_RAIN]: {
    color: '#00CED1',
    icon: 'rainy-outline',
    priority: AlertPriority.WARNING,
    autoExpire: 6 * 60 * 60 * 1000, // 6 hours
  },
  [AlertTypes.CYCLONE]: {
    color: '#DC143C',
    icon: 'refresh-circle-outline',
    priority: AlertPriority.EMERGENCY,
    autoExpire: 24 * 60 * 60 * 1000, // 24 hours
  },
  [AlertTypes.FOG_WARNING]: {
    color: '#708090',
    icon: 'eye-off-outline',
    priority: AlertPriority.ADVISORY,
    autoExpire: 8 * 60 * 60 * 1000, // 8 hours
  },
  [AlertTypes.AIR_QUALITY]: {
    color: '#9932CC',
    icon: 'leaf-outline',
    priority: AlertPriority.ADVISORY,
    autoExpire: 24 * 60 * 60 * 1000, // 24 hours
  },
  [AlertTypes.UV_WARNING]: {
    color: '#FFD700',
    icon: 'sunny-outline',
    priority: AlertPriority.ADVISORY,
    autoExpire: 12 * 60 * 60 * 1000, // 12 hours
  },
  [AlertTypes.GENERAL]: {
    color: '#666666',
    icon: 'information-circle-outline',
    priority: AlertPriority.ADVISORY,
    autoExpire: 12 * 60 * 60 * 1000, // 12 hours
  },
};

export const getAlertConfig = (alertType) => {
  return AlertConfig[alertType] || AlertConfig[AlertTypes.GENERAL];
};

export const getAlertSeverityColor = (severity) => {
  switch (severity) {
    case AlertSeverity.LOW:
      return '#4CAF50';
    case AlertSeverity.MODERATE:
      return '#FFA500';
    case AlertSeverity.HIGH:
      return '#FF6B35';
    case AlertSeverity.SEVERE:
      return '#FF4444';
    case AlertSeverity.EXTREME:
      return '#DC143C';
    default:
      return '#666666';
  }
};

export const getAlertPriorityColor = (priority) => {
  switch (priority) {
    case AlertPriority.ADVISORY:
      return '#4CAF50';
    case AlertPriority.WARNING:
      return '#FFA500';
    case AlertPriority.CRITICAL:
      return '#FF4444';
    case AlertPriority.EMERGENCY:
      return '#DC143C';
    default:
      return '#666666';
  }
};

export const isAlertExpired = (alert) => {
  if (!alert.timestamp || !alert.type) return false;
  
  const config = getAlertConfig(alert.type);
  const alertTime = new Date(alert.timestamp);
  const now = new Date();
  
  return (now.getTime() - alertTime.getTime()) > config.autoExpire;
};

export const formatAlertDuration = (alert) => {
  if (!alert.timestamp) return 'Unknown time';
  
  const alertTime = new Date(alert.timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};
