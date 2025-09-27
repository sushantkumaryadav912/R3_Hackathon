import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../database/firestore.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FeedbackService {
  constructor(private readonly firestore: FirestoreService, private readonly http: HttpService) {}

  async saveFeedback(userId: string, alertId: string, wasHelpful: boolean, metadata?: any) {
    const doc = {
      userId,
      alertId,
      wasHelpful,
      metadata: metadata || {},
      timestamp: new Date(),
    };
    await this.firestore.collection('user_feedback').add(doc);

    // Send reward to RL agent training endpoint (placeholder).
    try {
      const url = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/update-policy`;
      await firstValueFrom(this.http.post(url, { userId, alertId, reward: wasHelpful ? 1 : -1, metadata }));
    } catch (e) {
      // log and continue
      console.warn('Failed to send feedback to AI service', e.message || e);
    }

    return { ok: true };
  }
}
