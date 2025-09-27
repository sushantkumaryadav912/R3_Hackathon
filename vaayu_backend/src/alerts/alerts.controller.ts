import { Controller, Post, Body } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  // POST /api/alerts/decide
  // body: { forecast: {...}, userContext: {...} }
  @Post('decide')
  async decide(@Body() body: any) {
    const { forecast, userContext } = body;
    const decision = await this.alerts.getAlertAction(forecast, userContext);
    return decision;
  }

  // POST /api/alerts/send
  // body: { deviceToken, alert }
  @Post('send')
  async send(@Body() body: any) {
    const { deviceToken, alert } = body;
    await this.alerts.dispatchAlertToDevice(deviceToken, alert);
    return { status: 'sent' };
  }
}
