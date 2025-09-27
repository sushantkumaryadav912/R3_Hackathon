import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirestoreService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
    if (!admin.apps.length) {
      const keyFile = path.resolve(keyPath);
      if (!fs.existsSync(keyFile)) {
        console.warn('Firebase service account not found. Trying application default credentials.');
        admin.initializeApp();
      } else {
        const serviceAccount = require(keyFile);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    this.db = admin.firestore();
  }

  collection(name: string) {
    return this.db.collection(name);
  }
}
