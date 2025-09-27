import { Controller, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  // POST /api/feedback
  // body: { userId, alertId, wasHelpful, metadata? }
  @Post()
  async submit(@Body() body: any) {
    const { userId, alertId, wasHelpful, metadata } = body;
    return this.feedback.saveFeedback(userId, alertId, wasHelpful, metadata);
  }
}
