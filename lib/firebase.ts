import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'live-agent-monitor.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://live-agent-monitor-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'live-agent-monitor',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'live-agent-monitor.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase App singleton
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Realtime Database & Firestore SDKs
let rtdb: Database;
let db: Firestore;

try {
  rtdb = getDatabase(app);
} catch (e) {
  console.warn('[Firebase] RTDB initialization fallback:', e);
  rtdb = null as unknown as Database;
}

try {
  db = getFirestore(app);
} catch (e) {
  console.warn('[Firebase] Firestore initialization fallback:', e);
  db = null as unknown as Firestore;
}

/**
 * Mock DB In-Memory Fallback Instance
 * Used when running offline or when live Firebase backend connection is unavailable.
 */
export interface MockDBStore {
  logs: Record<string, any>;
  agents: Record<string, any>;
  commands: Record<string, any>;
}

export const mockStore: MockDBStore = {
  logs: {},
  agents: {},
  commands: {},
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'mock-api-key' &&
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  );
};

export { app, rtdb, db };

