import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

import { extractUser, requireUser } from './middleware/auth.js';
import { dbRun, dbGet } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(extractUser);

// Serve uploaded invoices statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Old (pre-Firebase) accounts used ids built from the phone/email text.
// Once the person proves they own that phone/email, we move their old data to the real account.
const legacyId = (type, identifier) =>
  `usr_${type}_${String(identifier).trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

// User Profile / Auth Sync Endpoint (identity comes from the verified token only)
app.post('/api/auth/sync', requireUser, async (req, res) => {
  try {
    const id = req.userId;
    const { name, photo_url, auth_provider } = req.body;
    const email = req.userEmail || '';
    const phone = req.userPhone || '';

    const existing = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (existing) {
      await dbRun(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), photo_url = COALESCE(?, photo_url) WHERE id = ?',
        [name || null, email || null, phone || null, photo_url || null, id]
      );
    } else {
      await dbRun(
        'INSERT INTO users (id, name, email, phone, photo_url, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name || '', email, phone, photo_url || '', auth_provider || (phone ? 'phone' : 'google')]
      );
    }

    // Move data from old-style account ids that match this VERIFIED phone/email
    const oldIds = [];
    if (phone) oldIds.push(legacyId('phone', phone));
    if (email) oldIds.push(legacyId('google', email));
    for (const oldId of oldIds) {
      if (oldId !== id) {
        await dbRun(
          'UPDATE purchases SET user_id = ?, user_email = COALESCE(NULLIF(?, \'\'), user_email), user_phone = COALESCE(NULLIF(?, \'\'), user_phone) WHERE user_id = ?',
          [id, email, phone, oldId]
        );
      }
    }

    // Automatically claim unowned legacy purchases if this user is the only user or first user
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCount && userCount.count <= 1) {
      await dbRun(
        'UPDATE purchases SET user_id = ?, user_email = COALESCE(?, user_email), user_phone = COALESCE(?, user_phone) WHERE user_id IS NULL',
        [id, email || null, phone || null]
      );
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ success: false, message: 'Failed to sync user profile' });
  }
});

// API Routes
app.use('/api/purchases', requireUser, purchaseRoutes);
app.use('/api/reports', requireUser, reportRoutes);
app.use('/api/search', requireUser, searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'My Purchase Tracker API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build files in production (Render, Cloud)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  }
});

// Start Server and Initialize Database
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 My Purchase Tracker API Server is live!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`📁 Uploads served from: ${uploadsDir}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Fatal: Failed to start backend server:', error);
    process.exit(1);
  }
};

startServer();
