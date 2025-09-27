import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  constructor(private readonly http: HttpService) {}

  async getForecast(lat: number, lon: number, timestamp?: string) {
    const url = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict`;
    const payload = { latitude: lat, longitude: lon, timestamp };
    const { data } = await firstValueFrom(this.http.post(url, payload));
    return data;
  }
}
