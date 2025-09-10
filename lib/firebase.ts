import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const hasRequiredConfig =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project"
    }.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project"
    }.appspot.com`,
  ...(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && {
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  }),
  ...(process.env.NEXT_PUBLIC_FIREBASE_APP_ID && {
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }),
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (hasRequiredConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth =
      getApps().length === 0
        ? initializeAuth(app, {
            persistence: browserLocalPersistence,
          })
        : getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("[v0] Firebase initialization failed:", error);
  }
}

export { auth, db, storage };
export default app;
