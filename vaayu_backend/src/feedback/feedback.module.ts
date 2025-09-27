import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DatabaseModule } from '../database/database.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
