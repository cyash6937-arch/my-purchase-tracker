/**
 * Authentication Middleware
 *
 * The browser sends the Firebase login token ("Authorization: Bearer <token>").
 * We verify it with Firebase, so the user identity can't be faked.
 * Nothing in the request body or other headers is trusted.
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'my-purchase-tracker';

let defaultVerifier = null;
function getDefaultVerifier() {
  if (!defaultVerifier) {
    if (getApps().length === 0) {
      initializeApp({ projectId: PROJECT_ID });
    }
    defaultVerifier = (token) => getAuth().verifyIdToken(token);
  }
  return defaultVerifier;
}

// Factory (also lets tests plug in a fake verifier)
export const createAuthMiddleware = (getVerifier) => async (req, res, next) => {
  req.userId = null;
  req.userEmail = null;
  req.userPhone = null;
  req.userName = null;

  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = await getVerifier()(header.slice(7).trim());
      req.userId = decoded.uid;
      req.userEmail = decoded.email || null;
      req.userPhone = decoded.phone_number || null;
      req.userName = decoded.name || null;
    } catch (err) {
      // Invalid / expired token: treat as not logged in
      req.userId = null;
    }
  }
  next();
};

export const extractUser = createAuthMiddleware(getDefaultVerifier);

// Blocks anyone who is not logged in
export const requireUser = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  next();
};
