const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class WeatherAPI {
  async makeRequest(endpoint, data = null) {
    try {
      const config = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WeatherAPI Error:', error);
      throw error;
    }
  }

  async getCurrentWeather(latitude, longitude) {
    return this.makeRequest('/weather/current', { latitude, longitude });
  }

  async getForecast(latitude, longitude, days = 7) {
    return this.makeRequest('/weather/forecast', { latitude, longitude, days });
  }

  async getHistoricalData(latitude, longitude, startDate, endDate) {
    return this.makeRequest('/weather/historical', { 
      latitude, 
      longitude, 
      startDate, 
      endDate 
    });
  }

  async getAlerts(latitude, longitude) {
    return this.makeRequest('/alerts/recommendation', { latitude, longitude });
  }

  async getAIForecast(latitude, longitude) {
    return this.makeRequest('/ai/predict', { latitude, longitude });
  }
}

export default new WeatherAPI();
