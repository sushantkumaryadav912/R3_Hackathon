import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { NotificationsService } from '../notifications/notifications.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AlertsService {
  constructor(private readonly http: HttpService, private readonly notifications: NotificationsService) {}

  // Query RL agent for action. Placeholder RL on AI service side returns STANDARD_ALERT for now.
  async getAlertAction(forecast: any, userContext: any) {
    try {
      const url = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/get-alert-action`;
      const { data } = await firstValueFrom(this.http.post(url, { forecast, userContext }));
      return data;
    } catch (e) {
      // fallback
      return { action: 'STANDARD_ALERT', message: 'Stay alert.' };
    }
  }

  async dispatchAlertToDevice(deviceToken: string, alert: { action: string; message: string }) {
    await this.notifications.sendPush(deviceToken, alert.message, { action: alert.action });
  }
}
