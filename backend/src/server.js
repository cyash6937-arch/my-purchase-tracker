import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded invoices statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

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
