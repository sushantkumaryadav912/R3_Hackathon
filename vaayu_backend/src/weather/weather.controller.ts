import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  // GET /api/weather?lat=18.5204&lon=73.8567
  @Get()
  async forecast(@Query('lat') lat: string, @Query('lon') lon: string, @Query('ts') ts?: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { error: 'Invalid lat/lon' };
    }
    return this.weather.getForecast(latitude, longitude, ts);
  }
}
