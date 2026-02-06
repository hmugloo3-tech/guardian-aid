import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, Auth } from "firebase/auth";

// Firebase configuration - these are publishable keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Lazy initialization to avoid crashing when keys aren't configured
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API key is not configured. Please add your Firebase config values.");
    }
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
    _auth.languageCode = navigator.language || 'en';
  }
  return _auth;
}

// Keep backward-compatible export (lazy getter)
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getFirebaseAuth() as any)[prop];
  },
  set(_target, prop, value) {
    (getFirebaseAuth() as any)[prop] = value;
    return true;
  },
});
 
 // reCAPTCHA verifier setup
 let recaptchaVerifier: RecaptchaVerifier | null = null;
 
 export function getRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
   if (recaptchaVerifier) {
     recaptchaVerifier.clear();
   }
   
   recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
     size: 'invisible',
     callback: () => {
       // reCAPTCHA solved - will proceed with phone auth
       console.log('reCAPTCHA verified');
     },
     'expired-callback': () => {
       // Response expired. Ask user to solve reCAPTCHA again.
       console.log('reCAPTCHA expired');
     }
   });
   
   return recaptchaVerifier;
 }
 
 export function clearRecaptcha() {
   if (recaptchaVerifier) {
     recaptchaVerifier.clear();
     recaptchaVerifier = null;
   }
 }