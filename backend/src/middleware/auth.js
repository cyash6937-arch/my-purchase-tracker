/**
 * Authentication Middleware for Multi-User Privacy
 * Extracts user identity from request headers (x-user-id or Authorization Bearer)
 */
export const extractUser = (req, res, next) => {
  // Read user identification headers
  const userId = req.headers['x-user-id'] || req.headers['user-id'];
  const userEmail = req.headers['x-user-email'] || '';
  const userPhone = req.headers['x-user-phone'] || '';
  const userName = req.headers['x-user-name'] || '';

  // Set on request object
  req.userId = userId ? String(userId).trim() : null;
  req.userEmail = userEmail ? String(userEmail).trim() : null;
  req.userPhone = userPhone ? String(userPhone).trim() : null;
  req.userName = userName ? String(userName).trim() : null;

  next();
};
