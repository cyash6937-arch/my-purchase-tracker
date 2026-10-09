import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut as fbSignOut
} from 'firebase/auth';

// Real Firebase configuration for my-purchase-tracker project
const firebaseConfig = {
  apiKey: "AIzaSyAMaLQxlfeOcoCBOxg7pK5R1LNxK_VyDQA",
  authDomain: "my-purchase-tracker.firebaseapp.com",
  projectId: "my-purchase-tracker",
  storageBucket: "my-purchase-tracker.firebasestorage.app",
  messagingSenderId: "87091949087",
  appId: "1:87091949087:web:f969ac1436ebdab6a6ef2a"
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
