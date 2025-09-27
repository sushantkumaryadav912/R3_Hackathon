import { Module } from '@nestjs/common';
import { FirestoreService } from './firestore/firestore.service';

@Module({
  providers: [FirestoreService]
})
export class DatabaseModule {}
