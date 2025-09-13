import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  type Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

export let app: ReturnType<typeof initializeApp> | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let initError: Error | null = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Авто-детект long-polling чтобы избежать 400 ошибок WebChannel за прокси/фаерволом
    db = initializeFirestore(app, {
      // Авто-детект транспортов (long-poll/fetch streams) против 400 Listen в некоторых сетях
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: true,
      ignoreUndefinedProperties: true,
      // Включаем офлайн-персистентность и очередь записей между перезагрузками
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    } as any);

    // Включаем подробные логи Firestore по флагу (в консоли браузера)
    try {
      if (localStorage.getItem('la_fs_debug') === '1') setLogLevel('debug');
    } catch {}
  } else {
    throw new Error('Firebase env vars are missing');
  }
} catch (e) {
  initError = e as Error;
}

export const providers = isFirebaseConfigured
  ? {
      google: new GoogleAuthProvider(),
      github: new GithubAuthProvider(),
      facebook: new FacebookAuthProvider(),
    }
  : ({} as Record<string, never>);
