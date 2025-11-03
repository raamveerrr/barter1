import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig, useEmulators, emulatorConfig } from '../config/firebase';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if in development
if (useEmulators) {
  try {
    connectAuthEmulator(auth, emulatorConfig.auth.url, emulatorConfig.auth.options);
    connectFirestoreEmulator(db, emulatorConfig.firestore.host, emulatorConfig.firestore.port);
    connectStorageEmulator(storage, emulatorConfig.storage.host, emulatorConfig.storage.port);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulators already connected or not available:', error.message);
  }
}

export default app;
