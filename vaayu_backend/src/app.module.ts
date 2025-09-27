import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from './database/database.module';
import { WeatherModule } from './weather/weather.module';
import { AlertsModule } from './alerts/alerts.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    WeatherModule,
    AlertsModule,
    FeedbackModule,
    NotificationsModule,
  ],
})
export class AppModule {}
