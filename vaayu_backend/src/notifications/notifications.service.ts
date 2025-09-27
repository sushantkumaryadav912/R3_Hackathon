import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private initialized = false;

  constructor() {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (e) {
        console.warn('FCM init failed. Ensure service account is configured.', e.message || e);
      }
    }
    this.initialized = !!admin.apps.length;
  }

  async sendPush(token: string, message: string, data?: Record<string, string>) {
    if (!this.initialized) throw new Error('FCM not initialized');
    const payload: admin.messaging.Message = {
      token,
      notification: {
        title: 'Vaayu Alert',
        body: message,
      },
      data: data || {},
    };
    return admin.messaging().send(payload);
  }
}
