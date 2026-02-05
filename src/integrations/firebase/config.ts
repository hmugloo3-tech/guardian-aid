 import { initializeApp } from "firebase/app";
 import { getAuth, RecaptchaVerifier } from "firebase/auth";
 
 // Firebase configuration - these are publishable keys
 const firebaseConfig = {
   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
   appId: import.meta.env.VITE_FIREBASE_APP_ID,
 };
 
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 export const auth = getAuth(app);
 
 // Set language to user's browser language
 auth.languageCode = navigator.language || 'en';
 
 // reCAPTCHA verifier setup
 let recaptchaVerifier: RecaptchaVerifier | null = null;
 
 export function getRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
   if (recaptchaVerifier) {
     recaptchaVerifier.clear();
   }
   
   recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
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