import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

import { extractUser } from './middleware/auth.js';
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

// User Profile / Auth Sync Endpoint
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { id, name, email, phone, photo_url, auth_provider } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const existing = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (existing) {
      await dbRun(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), photo_url = COALESCE(?, photo_url) WHERE id = ?',
        [name, email, phone, photo_url, id]
      );
    } else {
      await dbRun(
        'INSERT INTO users (id, name, email, phone, photo_url, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name || '', email || '', phone || '', photo_url || '', auth_provider || 'google']
      );
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
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);

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
