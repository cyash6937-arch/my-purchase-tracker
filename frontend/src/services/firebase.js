import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut as fbSignOut
} from 'firebase/auth';

// Standard Firebase configuration
// Can be customized via Vite environment variables VITE_FIREBASE_API_KEY, etc.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoDummyKeyForAuth_SafeFallback",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-purchase-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-purchase-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "my-purchase-tracker.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let auth = null;
let googleProvider = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  console.warn('Firebase initialized in flexible fallback mode:', err.message);
}

export { auth, googleProvider };

/**
 * Generate a consistent user ID from email or phone
 */
export function generateUserId(type, identifier) {
  const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `usr_${type}_${clean}`;
}

/**
 * Format phone number to E.164 (+91XXXXXXXXXX)
 */
export function formatPhoneNumber(number, countryCode = '+91') {
  let cleaned = (number || '').replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${countryCode}${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (number.startsWith('+')) {
    return number.replace(/\s+/g, '');
  }
  return `${countryCode}${cleaned}`;
}
